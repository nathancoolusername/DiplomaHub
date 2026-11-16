import "server-only";

import { cache } from "react";
import type { CalendarItem, CalendarItemKind } from "@/lib/data/types";
import { toCatalogSubjectId, toHubSubjectId } from "@/lib/hub-subjects";
import { check, db, requireUserId } from "./client";
import { getUserSubjects } from "./viewer";

// The Hub's own table, hub_items, with DiplomaPro's has_timer / kind /
// set_id columns. Items made before DiplomaPro have no kind: they count as
// deadlines (or study sessions for study blocks), never as tests.

type HubItemRow = {
  id: string;
  title: string;
  type: string;
  subject_id: string | null;
  start_at: string;
  has_timer: boolean;
  kind: CalendarItemKind | null;
  set_id: string | null;
};

function toItem(r: HubItemRow, takenIds: string[]): CalendarItem {
  return {
    id: r.id,
    title: r.title,
    kind: r.kind ?? (r.type === "study_block" ? "study" : "deadline"),
    // Hub items say "english"; DiplomaPro knows the student's actual English course.
    subjectId: r.subject_id ? toCatalogSubjectId(r.subject_id, takenIds) : null,
    startsAt: r.start_at,
    isDeadline: r.kind === "deadline" || (r.kind === null && (r.type === "task" || r.type === "ib_component")),
    hasTimer: r.has_timer,
    setId: r.set_id,
  };
}

/** Upcoming items (from the start of today), soonest first. */
export const getCalendarItems = cache(async (): Promise<CalendarItem[]> => {
  const uid = await requireUserId();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  // Both at once: the subjects only matter for naming languages afterwards.
  const [subjects, { data, error }] = await Promise.all([
    getUserSubjects(),
    (await db())
      .from("hub_items")
      .select("id, title, type, subject_id, start_at, has_timer, kind, set_id")
      .eq("owner_id", uid)
      .neq("status", "done")
      .gte("start_at", today.toISOString())
      .order("start_at")
      .limit(200),
  ]);
  check(error);
  const takenIds = subjects.map((s) => s.subject.id);
  return ((data ?? []) as HubItemRow[]).map((r) => toItem(r, takenIds));
});

/** Items starting from now until the end of the day `days` days ahead. */
export async function getUpcomingItems(days: number): Promise<CalendarItem[]> {
  const end = new Date();
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);
  const now = Date.now();
  return (await getCalendarItems()).filter((i) => {
    const t = new Date(i.startsAt).getTime();
    return t >= now && t <= end.getTime();
  });
}

/** The Home countdown target: the nearest upcoming item ticked "Show a countdown". */
export async function getNextTimedItem(): Promise<CalendarItem | null> {
  const now = Date.now();
  return (await getCalendarItems()).find((i) => i.hasTimer && new Date(i.startsAt).getTime() >= now) ?? null;
}

/**
 * "Schedule": a study session on the Hub that opens this set. Students may
 * write their own hub_items (RLS); the set is checked to be theirs first.
 */
export async function scheduleSet(
  setId: string,
  /** subjectId: the set's own when left out. */
  slot: { title: string; subjectId?: string; startAt: string; endAt: string },
): Promise<string> {
  const uid = await requireUserId();
  const sb = await db();
  const own = await sb.from("practice_sets").select("id, subject_id").eq("id", setId).eq("owner_id", uid).maybeSingle();
  check(own.error);
  if (!own.data) throw new Error("Set not found");
  const subjectId = slot.subjectId ?? (own.data.subject_id as string);
  const id = `itm-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await sb.from("hub_items").insert({
    id,
    owner_id: uid,
    title: slot.title,
    type: "study_block",
    // The Hub's own id for the subject, so its chips, colours and filters match.
    subject_id: toHubSubjectId(subjectId),
    start_at: slot.startAt,
    end_at: slot.endAt,
    all_day: false,
    status: "todo",
    has_timer: false,
    kind: "study",
    set_id: setId,
  });
  check(error);
  return id;
}

/** Finishing a set ticks off the study sessions scheduled for it. */
export async function completeScheduledSet(setId: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await (await db())
    .from("hub_items")
    .update({ status: "done" })
    .eq("owner_id", uid)
    .eq("set_id", setId)
    .eq("status", "todo");
  check(error);
}

/** Adds Hub items from a card Bro proposed (after the student tapped "Add to Hub"). Returns the new ids. */
export async function addHubItems(
  items: { title: string; kind: "test" | "mock" | "deadline" | "study"; subjectId: string | null; start: string; end: string; allDay: boolean; practiceSetId?: string | null }[],
): Promise<string[]> {
  const uid = await requireUserId();
  const sb = await db();
  // Study sessions for practice sets link to them (set_id), only for the student's own sets.
  const wanted = [...new Set(items.map((i) => i.practiceSetId).filter((id): id is string => typeof id === "string" && !!id))];
  const own = new Set<string>();
  if (wanted.length) {
    const { data, error } = await sb.from("practice_sets").select("id").eq("owner_id", uid).in("id", wanted);
    check(error);
    for (const r of data ?? []) own.add(r.id as string);
  }
  const rows = items.map((i) => ({
    id: `itm-${crypto.randomUUID().slice(0, 8)}`,
    owner_id: uid,
    title: i.title.slice(0, 200),
    type: i.kind === "study" ? "study_block" : "task",
    subject_id: i.subjectId ? toHubSubjectId(i.subjectId) : null,
    start_at: i.start,
    end_at: i.end,
    all_day: i.allDay,
    status: "todo",
    // Tests and mocks get a countdown on Home, like the add dialog's default; the student can switch it off.
    has_timer: i.kind === "test" || i.kind === "mock",
    kind: i.kind,
    notes: "Added by Bro",
    set_id: i.practiceSetId && own.has(i.practiceSetId) ? i.practiceSetId : null,
  }));
  const { error } = await sb.from("hub_items").insert(rows);
  check(error);
  return rows.map((r) => r.id);
}
