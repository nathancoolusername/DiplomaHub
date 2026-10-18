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
  slot: { title: string; subjectId: string; startAt: string; endAt: string },
): Promise<string> {
  const uid = await requireUserId();
  const sb = await db();
  const own = await sb.from("practice_sets").select("id").eq("id", setId).eq("owner_id", uid).maybeSingle();
  check(own.error);
  if (!own.data) throw new Error("Set not found");
  const id = `itm-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await sb.from("hub_items").insert({
    id,
    owner_id: uid,
    title: slot.title,
    type: "study_block",
    // The Hub's own id for the subject, so its chips, colours and filters match.
    subject_id: toHubSubjectId(slot.subjectId),
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
