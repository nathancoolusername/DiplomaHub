import "server-only";

import { subjectById, findSubtopic, topicTree } from "@/lib/catalog";
import { buildSet, createRedoSet, getSet, getSetQuestions, getUserSubjects, renameSet, saveSet } from "@/lib/data";
import { allSubjects } from "@/lib/catalog";
import { sessionIdFromLabel, sessionLabelFromId } from "@/lib/exam-sessions";
import type { BuildSettings, SubjectId } from "@/lib/data/types";
import type { SettingsCard, SettingsOp, CodeCard, HubCard, HubCardItem, HubChangesCard, HubItemSnapshot, RedeemCard, ResourcesCard, SetCard } from "./cards";
import { createHubSetCode, createShareCode, getExamSession, getExamSessions, getProStatus, getThemePreference, redeemCode } from "@/lib/data";
import { toCatalogSubjectId, toHubSubjectId } from "@/lib/hub-subjects";
import { REDEEM_MESSAGES } from "@/lib/codes";
import { normaliseCode, redeemedText } from "./redeem";
import { db, requireUserId } from "@/lib/data/supabase/client";
import { createPublicClient } from "@/app/lib/supabase/public";

// Bro's acting tools, run by the chat route for the signed-in student.
// Everything the model sends is checked here first: only the student's
// subjects, only subtopics that exist, sane counts, real dates.

type Result<T> = { ok: true; card: T; note: string } | { ok: false; reason: string };

/** build_set: makes a practice set (same database function as Build your set's Go). */
export async function runBuildSet(input: Record<string, unknown>): Promise<Result<SetCard>> {
  const subjects = await getUserSubjects();
  const us = subjects.find((s) => s.subject.id === input.subject_id);
  if (!us) return { ok: false, reason: "That isn't one of their subjects." };
  const subjectId = us.subject.id as SubjectId;
  const codes = Array.isArray(input.subtopic_codes) ? input.subtopic_codes.filter((c): c is string => typeof c === "string") : [];
  // A topic code ("9") stands for all its subtopics; subtopic codes must exist.
  const ids = new Set<string>();
  for (const code of codes.slice(0, 8)) {
    const topic = topicTree(subjectId).find((t) => t.code === code);
    if (topic) topic.subtopics.forEach((s) => ids.add(s.id));
    else if (findSubtopic(subjectId, code)) ids.add(code);
  }
  if (ids.size === 0) return { ok: false, reason: `None of those subtopics exist in ${us.subject.shortName}. Use codes from the syllabus, e.g. "${topicTree(subjectId)[0]?.subtopics[0]?.id ?? "1.1"}".` };
  const count = Math.min(20, Math.max(3, Math.round(Number(input.count) || 8)));
  const qt = input.question_type === "mcq" || input.question_type === "short" ? input.question_type : "mix";
  const difficulty = (["easier", "exam", "harder", "mixed"] as const).includes(input.difficulty as never) ? (input.difficulty as BuildSettings["difficulty"]) : "mixed";
  const timed = input.timed === true;
  const settings: BuildSettings = {
    subtopicIds: [...ids],
    questionType: qt,
    count,
    difficulty,
    paper: null,
    calculator: true,
    includeHl: us.level === "HL",
    timer: timed ? "exam_pace" : "off",
    mcqFeedback: timed ? "end" : "each",
    answerOn: "screen",
  };
  let set;
  try {
    set = await buildSet(subjectId, "mcq_short", us.level, settings, { writtenCap: null, save: true });
  } catch (e) {
    return { ok: false, reason: e instanceof Error && /no questions|not enough/i.test(e.message) ? "There aren't questions for those subtopics yet." : "Couldn't build that set." };
  }
  if (set.questionIds.length === 0) return { ok: false, reason: "There aren't questions for those subtopics yet." };
  const title = typeof input.title === "string" && input.title.trim() ? input.title.trim().slice(0, 60) : null;
  if (title) await renameSet(set.id, title).catch(() => undefined);
  const topics = [...ids].slice(0, 6).map((id) => {
    const s = findSubtopic(subjectId, id);
    return s ? `${s.code} ${s.shortName}` : id;
  });
  return {
    ok: true,
    card: {
      type: "set",
      setId: set.id,
      title: title ?? set.title,
      subjectId,
      subjectName: us.subject.shortName,
      questionCount: set.questionIds.length,
      topics: ids.size > 6 ? [...topics, `+${ids.size - 6} more`] : topics,
      timed,
    },
    note: `Built "${title ?? set.title}" (practice_set_id ${set.id}): ${set.questionIds.length} questions. The student sees it as a card with Start and Edit buttons, so don't paste a link to it. To schedule it, give its study session this practice_set_id in propose_hub_items.`,
  };
}

/** One of the student's own practice sets (owner_id, and RLS), or null. */
async function ownSet(id: unknown): Promise<{ id: string; title: string } | null> {
  if (typeof id !== "string" || !id.trim()) return null;
  const uid = await requireUserId();
  const { data } = await (await db()).from("practice_sets").select("id, title").eq("owner_id", uid).eq("id", id.trim()).maybeSingle();
  return (data as { id: string; title: string } | null) ?? null;
}

/** rename_set: renames one of their practice sets straight away (it's easy to rename back). */
export async function runRenameSet(input: Record<string, unknown>): Promise<{ ok: true; text: string } | { ok: false; reason: string }> {
  const set = await ownSet(input.practice_set_id);
  if (!set) return { ok: false, reason: "That isn't one of their practice sets." };
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 120) : "";
  if (!title) return { ok: false, reason: "Give the set a name." };
  await renameSet(set.id, title);
  return { ok: true, text: `Renamed "${set.title}" to "${title}".` };
}

/**
 * redo_set: a set to do again. "wrong": a new set of the questions they lost
 * marks on in their latest finished attempt of it (same as Redo on the
 * results page); "all": the same set. Saved to My sets, shown as a set card.
 */
export async function runRedoSet(input: Record<string, unknown>): Promise<Result<SetCard>> {
  const set = await ownSet(input.practice_set_id);
  if (!set) return { ok: false, reason: "That isn't one of their practice sets." };
  let id = set.id;
  if (input.which === "wrong") {
    const uid = await requireUserId();
    const { data } = await (await db())
      .from("attempts")
      .select("id")
      .eq("user_id", uid)
      .eq("set_id", set.id)
      .eq("status", "marked")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return { ok: false, reason: "They haven't finished that set yet, so there's nothing to redo." };
    try {
      id = (await createRedoSet((data as { id: string }).id)).id;
    } catch {
      return { ok: false, reason: "They didn't lose any marks on that set, or it couldn't be copied." };
    }
  }
  await saveSet(id).catch(() => undefined);
  const [redo, questions] = await Promise.all([getSet(id), getSetQuestions(id).catch(() => [])]);
  if (!redo) return { ok: false, reason: "Couldn't load the set." };
  const subjectId = redo.subjectId;
  const codes = [...new Set(questions.map((q) => q.subtopicId))];
  const topics = codes.slice(0, 6).map((c) => {
    const st = findSubtopic(subjectId, c);
    return st ? `${st.code} ${st.shortName}` : c;
  });
  return {
    ok: true,
    card: {
      type: "set",
      setId: redo.id,
      title: redo.title,
      subjectId,
      subjectName: subjectById(subjectId)?.shortName ?? subjectId,
      questionCount: redo.questionIds.length,
      topics: codes.length > 6 ? [...topics, `+${codes.length - 6} more`] : topics,
      timed: redo.settings.timer === "exam_pace",
    },
    note: `${input.which === "wrong" ? "Made a redo set" : "Here's the set again"}: "${redo.title}" (practice_set_id ${redo.id}), ${redo.questionIds.length} questions, shown as a card with Start, Edit and PDF. To schedule it, give its study session this practice_set_id in propose_hub_items.`,
  };
}

/** The UTC instant of a wall-clock time in a timezone (DST-safe). */
function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  const offsetAt = (t: number) => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
        .formatToParts(new Date(t))
        .map((x) => [x.type, x.value]),
    );
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t;
  };
  let t = wall - offsetAt(wall);
  t = wall - offsetAt(t);
  return new Date(t);
}

/** propose_hub_items: checks Bro's proposal and turns it into a card; nothing is written until the student taps Add. */
export async function runProposeHubItems(input: Record<string, unknown>, timeZone: string): Promise<Result<HubCard>> {
  const subjects = await getUserSubjects();
  const raw = Array.isArray(input.items) ? input.items.slice(0, 12) : [];
  const items: HubCardItem[] = [];
  // Practice sets the sessions are for: only the student's own (RLS and owner_id).
  const setIds = [...new Set((raw as Record<string, unknown>[]).map((r) => (typeof r.practice_set_id === "string" ? r.practice_set_id.trim() : "")).filter(Boolean))].slice(0, 12);
  const ownSets = new Map<string, { title: string; subjectId: string }>();
  if (setIds.length) {
    const uid = await requireUserId();
    const { data } = await (await db()).from("practice_sets").select("id, title, subject_id").eq("owner_id", uid).in("id", setIds);
    for (const r of data ?? []) ownSets.set(r.id as string, { title: r.title as string, subjectId: r.subject_id as string });
  }
  const today = Date.now() - 86_400_000;
  for (const r of raw as Record<string, unknown>[]) {
    const title = typeof r.title === "string" ? r.title.replace(/\s+/g, " ").trim().slice(0, 80) : "";
    const kind = (["test", "mock", "deadline", "study"] as const).includes(r.kind as never) ? (r.kind as HubCardItem["kind"]) : null;
    const date = typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : null;
    if (!title || !kind || !date) return { ok: false, reason: "Each item needs a title, a kind and a date (YYYY-MM-DD)." };
    const time = typeof r.start_time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.start_time) ? r.start_time : null;
    const minutes = Math.min(600, Math.max(15, Math.round(Number(r.duration_minutes) || (kind === "study" ? 60 : 60))));
    const setId = typeof r.practice_set_id === "string" ? r.practice_set_id.trim() : "";
    const set = setId ? ownSets.get(setId) : undefined;
    if (setId && !set) return { ok: false, reason: `There's no practice set ${setId} in their sets. Use an id from build_set's result or the student context.` };
    const subjectRef = set ? set.subjectId : r.subject_id;
    const us = typeof subjectRef === "string" ? subjects.find((s) => s.subject.id === subjectRef) : undefined;
    const start = time ? zonedToUtc(date, time, timeZone) : zonedToUtc(date, "00:00", timeZone);
    if (Number.isNaN(start.getTime()) || start.getTime() < today || start.getTime() > Date.now() + 400 * 86_400_000) {
      return { ok: false, reason: `${date} isn't a valid date from today on.` };
    }
    const end = time ? new Date(start.getTime() + minutes * 60_000) : zonedToUtc(date, "23:59", timeZone);
    items.push({
      title,
      kind,
      subjectId: us?.subject.id ?? null,
      subjectName: us?.subject.shortName ?? (typeof r.subject_id === "string" ? subjectById(r.subject_id as SubjectId)?.shortName ?? null : null),
      start: start.toISOString(),
      end: end.toISOString(),
      // A set needs a time slot to do it in.
      allDay: set ? false : !time,
      ...(set ? { practiceSetId: setId, practiceSetTitle: set.title } : {}),
    });
    if (set && !time) {
      const day = zonedToUtc(date, "17:00", timeZone);
      items[items.length - 1].start = day.toISOString();
      items[items.length - 1].end = new Date(day.getTime() + minutes * 60_000).toISOString();
    }
    if (set) items[items.length - 1].kind = "study";
  }
  if (items.length === 0) return { ok: false, reason: "Nothing to add." };
  items.sort((a, b) => a.start.localeCompare(b.start));
  const title = typeof input.plan_title === "string" && input.plan_title.trim() ? input.plan_title.replace(/\s+/g, " ").trim().slice(0, 60) : null;
  return {
    ok: true,
    card: { type: "hub", status: "proposed", items, title },
    note: `Shown to the student as a preview card${title ? ` named "${title}" with a calendar view` : ""} and an "Add to Hub" button (${items.length} item${items.length === 1 ? "" : "s"}${items.some((i) => i.practiceSetId) ? "; the study sessions for sets open those sets from the Hub" : ""}). Nothing is in their Hub until they tap it, so don't say it's added; ask if it looks right.${title ? " Once added, they can get a share code for it from the card." : ""}`,
  };
}

/**
 * find_resources: published DiplomaHub resources (student-made notes,
 * exemplars, templates) for a subject and what they need. Keyword match on
 * title, description and type; best matches first, then the most liked.
 */
export async function runFindResources(input: Record<string, unknown>): Promise<Result<ResourcesCard>> {
  const subjects = await getUserSubjects();
  const us = typeof input.subject_id === "string" ? subjects.find((s) => s.subject.id === input.subject_id) : undefined;
  const raw = typeof input.query === "string" ? input.query.toLowerCase() : "";
  const words = [...new Set(raw.split(/[^a-z0-9]+/).filter((w) => w.length >= 2 && !["the", "and", "for", "with", "my", "on", "of", "a", "to", "in"].includes(w)))].slice(0, 6);
  // Coursework lives under its own tags too ("EE", "TOK", "IA" resources are tagged by subject).
  const tags = new Set<string>();
  if (us?.subject.resourceTag) tags.add(us.subject.resourceTag);
  if (/\bee\b|extended essay/.test(raw)) tags.add("EE");
  if (/\btok\b|theory of knowledge/.test(raw)) tags.add("TOK");
  if (/\bcas\b/.test(raw)) tags.add("CAS");

  let q = createPublicClient().from("resources").select("id, title, description, subject_tag, type_tag, like_count, download_count").eq("published", true);
  if (tags.size) q = q.in("subject_tag", [...tags]);
  if (words.length) q = q.or(words.map((w) => `title.ilike.%${w}%,description.ilike.%${w}%,type_tag.ilike.%${w}%`).join(","));
  const { data, error } = await q.limit(60);
  if (error) return { ok: false, reason: "Couldn't search resources right now." };
  type Row = { id: string; title: string; description: string | null; subject_tag: string; type_tag: string; like_count: number; download_count: number };
  const scored = ((data ?? []) as Row[])
    .map((r) => {
      const hay = `${r.title} ${r.description ?? ""} ${r.type_tag}`.toLowerCase();
      return { r, score: words.filter((w) => hay.includes(w)).length * 10 + (r.like_count ?? 0) + (r.download_count ?? 0) / 10 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  if (scored.length === 0) {
    return { ok: false, reason: `No DiplomaHub resources match that yet${us ? ` in ${us.subject.shortName}` : ""}. Don't suggest other websites: help them directly instead.` };
  }
  return {
    ok: true,
    card: { type: "resources", items: scored.map(({ r }) => ({ id: r.id, title: r.title, typeTag: r.type_tag, subjectTag: r.subject_tag })) },
    note: `Shown as a card with Open buttons: ${scored.map(({ r }) => `"${r.title}" (${r.type_tag})`).join("; ")}. Say in a line why they help; don't list them again.`,
  };
}

// ── Editing and deleting existing Hub items and sets ─────────────────────

type ItemRow = {
  id: string;
  title: string;
  kind: HubCardItem["kind"] | null;
  type: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  status?: string;
  has_timer?: boolean;
  notes?: string | null;
  subject_id?: string | null;
  stages?: { label: string; done: boolean }[] | null;
  hub_set_id?: string | null;
};
const ITEM_ROW = "id, title, kind, type, start_at, end_at, all_day, status, has_timer, notes, subject_id, stages, hub_set_id";

const kindOf = (r: ItemRow): HubItemSnapshot["kind"] => r.kind ?? (r.type === "study_block" ? "study" : r.type === "task" ? "deadline" : null);
const subjectNameOf = (hubId: string | null | undefined) => {
  if (!hubId) return null;
  const cat = toCatalogSubjectId(hubId);
  return (cat && subjectById(cat as SubjectId)?.shortName) || null;
};
const snap = (r: ItemRow): HubItemSnapshot => ({
  title: r.title,
  kind: kindOf(r),
  start: new Date(r.start_at).toISOString(),
  end: new Date(r.end_at).toISOString(),
  allDay: r.all_day,
  done: r.status === "done",
  timer: !!r.has_timer,
  notes: r.notes ?? null,
  subjectId: r.subject_id ?? null,
  subjectName: subjectNameOf(r.subject_id),
  stages: (r.stages ?? []).map((st) => st.label),
});

/** The student's local calendar day and HH:MM of an instant. */
function localParts(iso: string, timeZone: string): { date: string; time: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/** find_hub_items: the student's Hub items by words and/or a date range, with ids (text for Bro, no card). */
export async function runFindHubItems(input: Record<string, unknown>, timeZone: string): Promise<{ ok: true; text: string } | { ok: false; reason: string }> {
  const uid = await requireUserId();
  const from = typeof input.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.from) ? zonedToUtc(input.from, "00:00", timeZone) : new Date(Date.now() - 7 * 86_400_000);
  const to = typeof input.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.to) ? zonedToUtc(input.to, "23:59", timeZone) : new Date(Date.now() + 180 * 86_400_000);
  const words = typeof input.query === "string" ? input.query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 2).slice(0, 5) : [];
  let q = (await db()).from("hub_items").select("id, title, kind, type, start_at, end_at, all_day").eq("owner_id", uid).gte("start_at", from.toISOString()).lte("start_at", to.toISOString());
  if (words.length) q = q.or(words.map((w) => `title.ilike.%${w}%`).join(","));
  const { data, error } = await q.order("start_at").limit(30);
  if (error) return { ok: false, reason: "Couldn't search their Hub." };
  const rows = (data ?? []) as ItemRow[];
  if (rows.length === 0) return { ok: true, text: "No matching items in their Hub." };
  return {
    ok: true,
    text: rows
      .map((r) => {
        const l = localParts(r.start_at, timeZone);
        return `[${r.id}] ${l.date}${r.all_day ? " all day" : ` ${l.time}`}: ${r.title} (${kindOf(r) ?? r.type})`;
      })
      .join("\n"),
  };
}

/**
 * propose_hub_changes: checks every change against the student's own items
 * and sets and returns a card; nothing changes until they tap Apply.
 * Items: move, rename, retype, tick off or reopen, countdown on/off, notes,
 * subject, checklist, delete. Sets: create, rename, add or remove items, delete.
 */
export async function runProposeHubChanges(input: Record<string, unknown>, timeZone: string): Promise<Result<HubChangesCard>> {
  const uid = await requireUserId();
  const sb = await db();
  const rawItems = Array.isArray(input.items) ? (input.items as Record<string, unknown>[]).slice(0, 25) : [];
  const rawSets = Array.isArray(input.sets) ? (input.sets as Record<string, unknown>[]).slice(0, 5) : [];
  if (!rawItems.length && !rawSets.length) return { ok: false, reason: "Nothing to change." };

  const ids = new Set<string>();
  for (const r of rawItems) if (typeof r.item_id === "string") ids.add(r.item_id);
  for (const r of rawSets) if (Array.isArray(r.item_ids)) for (const x of r.item_ids) if (typeof x === "string") ids.add(x);
  const { data: rows } = ids.size ? await sb.from("hub_items").select(ITEM_ROW).eq("owner_id", uid).in("id", [...ids].slice(0, 100)) : { data: [] as ItemRow[] };
  const byId = new Map(((rows ?? []) as ItemRow[]).map((r) => [r.id, r]));
  const missing = (id: unknown) => `There's no item ${String(id)} in their Hub. Use find_hub_items to get the right id.`;
  const mySubjects = (await getUserSubjects()).map((u) => u.subject);

  const items: HubChangesCard["items"] = [];
  for (const r of rawItems) {
    const row = typeof r.item_id === "string" ? byId.get(r.item_id) : undefined;
    if (!row) return { ok: false, reason: missing(r.item_id) };
    const before = snap(row);
    if (r.action === "delete") {
      items.push({ id: row.id, action: "delete", before });
      continue;
    }
    const cur = localParts(row.start_at, timeZone);
    const date = typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : cur.date;
    const time = typeof r.start_time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.start_time) ? r.start_time : null;
    const allDay = r.all_day === true ? true : r.all_day === false || time ? false : row.all_day;
    const length = Number(r.duration_minutes) > 0 ? Math.min(600, Math.round(Number(r.duration_minutes))) : Math.round((Date.parse(row.end_at) - Date.parse(row.start_at)) / 60000);
    const start = allDay ? zonedToUtc(date, "00:00", timeZone) : zonedToUtc(date, time ?? (row.all_day ? "09:00" : cur.time), timeZone);
    const end = allDay ? zonedToUtc(date, "23:59", timeZone) : new Date(start.getTime() + Math.max(15, row.all_day && !(Number(r.duration_minutes) > 0) ? 60 : length) * 60000);
    if (Number.isNaN(start.getTime())) return { ok: false, reason: "That date isn't valid." };
    const title = typeof r.title === "string" && r.title.trim() ? r.title.replace(/\s+/g, " ").trim().slice(0, 200) : before.title;
    const kind = (["test", "mock", "deadline", "study"] as const).includes(r.kind as never) ? (r.kind as HubCardItem["kind"]) : before.kind;
    let subjectId = before.subjectId ?? null;
    if (r.subject_id === "none") subjectId = null;
    else if (typeof r.subject_id === "string") {
      const s = mySubjects.find((x) => x.id === r.subject_id);
      if (!s) return { ok: false, reason: `${r.subject_id} isn't one of their subjects. Use the subject ids from the student context.` };
      subjectId = toHubSubjectId(s.id);
    }
    const stages = Array.isArray(r.stages)
      ? (r.stages as unknown[]).filter((x): x is string => typeof x === "string" && !!x.trim()).map((x) => x.trim().slice(0, 120)).slice(0, 12)
      : before.stages;
    const after: HubItemSnapshot = {
      title,
      kind,
      start: start.toISOString(),
      end: end.toISOString(),
      allDay,
      done: typeof r.done === "boolean" ? r.done : before.done,
      timer: typeof r.timer === "boolean" ? r.timer : before.timer,
      notes: typeof r.notes === "string" ? r.notes.trim().slice(0, 5000) || null : before.notes,
      subjectId,
      subjectName: subjectNameOf(subjectId),
      stages,
    };
    if (JSON.stringify(after) === JSON.stringify(before)) continue;
    items.push({ id: row.id, action: "update", before, after });
  }

  const sets: HubChangesCard["sets"] = [];
  const cleanName = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 80) : "");
  for (const r of rawSets) {
    const itemIds = Array.isArray(r.item_ids) ? [...new Set((r.item_ids as unknown[]).filter((x): x is string => typeof x === "string"))].slice(0, 100) : [];
    for (const id of itemIds) if (!byId.has(id)) return { ok: false, reason: missing(id) };
    const itemTitles = itemIds.map((id) => byId.get(id)!.title);
    if (r.action === "create") {
      const name = cleanName(r.new_name ?? r.name);
      if (!name) return { ok: false, reason: "A new set needs a name (new_name)." };
      if (!itemIds.length) return { ok: false, reason: "A new set needs its items (item_ids)." };
      sets.push({ id: `new-${sets.length}`, action: "create", name, itemCount: itemIds.length, itemIds, itemTitles });
      continue;
    }
    if (typeof r.set_id !== "string") return { ok: false, reason: "Which set? Give its set_id." };
    const { data: set } = await sb.from("hub_sets").select("id, name").eq("id", r.set_id).eq("owner_id", uid).maybeSingle();
    if (!set) return { ok: false, reason: `There's no set ${r.set_id} in their Hub.` };
    const { count } = await sb.from("hub_items").select("id", { count: "exact", head: true }).eq("owner_id", uid).eq("hub_set_id", set.id);
    const base = { id: set.id as string, name: set.name as string, itemCount: count ?? 0 };
    if (r.action === "rename") {
      const newName = cleanName(r.new_name);
      if (!newName) return { ok: false, reason: "A rename needs the new name." };
      sets.push({ ...base, action: "rename", newName });
    } else if (r.action === "delete") {
      sets.push({ ...base, action: "delete", deleteItems: r.delete_items === true });
    } else if (r.action === "add_items" || r.action === "remove_items") {
      if (!itemIds.length) return { ok: false, reason: "Which items? Give item_ids." };
      if (r.action === "remove_items" && itemIds.some((id) => byId.get(id)!.hub_set_id !== set.id)) {
        return { ok: false, reason: "Some of those items aren't in that set." };
      }
      sets.push({ ...base, action: r.action, itemIds, itemTitles });
    }
  }
  if (!items.length && !sets.length) return { ok: false, reason: "Those changes wouldn't change anything." };

  const deletions = items.filter((i) => i.action === "delete").length + sets.filter((st) => st.action === "delete" && st.deleteItems).reduce((n, st) => n + st.itemCount, 0);
  return {
    ok: true,
    card: { type: "hub_changes", status: "proposed", items, sets },
    note: `Shown as a card of changes with an "Apply changes" button${deletions ? ` (${deletions} item${deletions === 1 ? "" : "s"} would be deleted)` : ""}. Nothing changes until they tap it, so don't say it's done; ask them to check it.`,
  };
}

// ── Share codes and redeeming (migration 32) ─────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * share_code: a code to send friends, for one of the student's practice sets,
 * Hub items, or Hub sets (an existing set, or items picked now with a name).
 * Making a code changes nothing for the student, so it's made straight away.
 */
export async function runShareCode(input: Record<string, unknown>): Promise<Result<CodeCard>> {
  const uid = await requireUserId();
  const sb = await db();
  const what = input.type;
  const id = typeof input.id === "string" ? input.id.trim() : "";
  try {
    if (what === "practice_set") {
      if (!UUID_RE.test(id)) return { ok: false, reason: "Give the practice set's id from the student context." };
      const { data: set } = await sb.from("practice_sets").select("id, title").eq("id", id).eq("owner_id", uid).maybeSingle();
      if (!set) return { ok: false, reason: "That isn't one of their practice sets." };
      const r = await createShareCode("practice_set", id);
      return { ok: true, card: { type: "code", codeType: "practice_set", code: r.code, title: set.title as string }, note: `Code ${r.code} for "${set.title}", shown as a card with copy buttons. Friends redeem it on /codes or by giving it to Bro.` };
    }
    if (what === "hub_item") {
      const { data: item } = await sb.from("hub_items").select("id, title").eq("id", id).eq("owner_id", uid).maybeSingle();
      if (!item) return { ok: false, reason: "That isn't one of their Hub items. Use find_hub_items for the id." };
      const r = await createShareCode("hub_item", id);
      return { ok: true, card: { type: "code", codeType: "hub_item", code: r.code, title: item.title as string }, note: `Code ${r.code} for "${item.title}", shown as a card with copy buttons.` };
    }
    if (what === "hub_set") {
      let name = typeof input.name === "string" ? input.name.replace(/\s+/g, " ").trim().slice(0, 80) : "";
      let itemIds = Array.isArray(input.item_ids) ? (input.item_ids as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 100) : [];
      if (id) {
        const { data: set } = await sb.from("hub_sets").select("id, name").eq("id", id).eq("owner_id", uid).maybeSingle();
        if (!set) return { ok: false, reason: "That isn't one of their Hub sets." };
        const { data: rows } = await sb.from("hub_items").select("id").eq("owner_id", uid).eq("hub_set_id", id);
        itemIds = (rows ?? []).map((x) => x.id as string);
        name ||= set.name as string;
      }
      if (!itemIds.length) return { ok: false, reason: "No items to share: give a Hub set id, or item_ids with a name." };
      if (!name) return { ok: false, reason: "Give the shared plan a name." };
      const r = await createHubSetCode(name, itemIds);
      return {
        ok: true,
        card: { type: "code", codeType: "hub_set", code: r.code, title: r.name, count: r.count },
        note: `Code ${r.code} for "${r.name}" (${r.count} items), shown as a card with copy buttons. Friends can keep the dates or start it on a day they pick.`,
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return { ok: false, reason: /today|at least|at most|name/i.test(msg) ? msg : "Couldn't make a code right now." };
  }
  return { ok: false, reason: "type must be practice_set, hub_item or hub_set." };
}

/**
 * redeem_code: uses a code the student gave Bro. Practice sets, Hub items and
 * Pro trials are redeemed straight away (they asked); a Hub set first asks
 * keep-the-dates or start-on, on the card.
 */
export async function runRedeemCode(input: Record<string, unknown>): Promise<Result<RedeemCard>> {
  const code = normaliseCode(input.code);
  if (!code) return { ok: false, reason: "That doesn't look like a DiplomaHub code (5 or 10 letters and digits, never 0, O, 1, I or L)." };
  const r = await redeemCode(code);
  if (r.ok) {
    const result = redeemedText(r);
    return { ok: true, card: { type: "redeem", code, status: "done", result }, note: `Redeemed: ${result.text} Shown as a card with an Open button.` };
  }
  if (r.reason === "needs_choice") {
    return {
      ok: true,
      card: { type: "redeem", code, status: "needs_choice", preview: r.preview },
      note: `It's a Hub set, "${r.preview.name}" (${r.preview.count} items). The card asks them to keep the original dates or start it on a day they pick; it isn't added until they choose.`,
    };
  }
  const why = r.reason === "bad_date" ? r.message : REDEEM_MESSAGES[r.reason].title + ". " + REDEEM_MESSAGES[r.reason].body;
  return { ok: false, reason: `Not redeemed: ${why}` };
}

// ── Settings (propose_settings) ──────────────────────────────────────────

const THEME_LABEL = { system: "Match my device", light: "Light", dark: "Dark", midnight: "Midnight" } as const;
type Lvl = "HL" | "SL";
const lvl = (v: unknown): Lvl | null => (v === "HL" || v === "SL" ? v : null);

/**
 * propose_settings: checks each change against their account and returns a
 * card; nothing changes until they tap Apply. Theme, exam session, HL/SL,
 * extra classes, swapping one of the six subjects, the public Pro badge.
 */
export async function runProposeSettings(input: Record<string, unknown>): Promise<Result<SettingsCard>> {
  const [mine, sessions, session, theme, pro] = await Promise.all([getUserSubjects(), getExamSessions(), getExamSession(), getThemePreference(), getProStatus()]);
  const ops: SettingsOp[] = [];
  const all = allSubjects();

  if (typeof input.theme === "string") {
    const t = input.theme as keyof typeof THEME_LABEL;
    if (!(t in THEME_LABEL)) return { ok: false, reason: "theme is system, light, dark or midnight." };
    if (t === "midnight" && !pro.isPro) return { ok: false, reason: "Midnight is a DiplomaPro theme." };
    if (t !== theme) ops.push({ op: "theme", value: t, label: "Theme", before: theme ? THEME_LABEL[theme] : "Not set", after: THEME_LABEL[t] });
  }
  if (typeof input.exam_session === "string") {
    const id = sessionIdFromLabel(input.exam_session) ?? input.exam_session.toLowerCase();
    const found = sessions.find((x) => x.id === id);
    if (!found) return { ok: false, reason: `Unknown exam session. Pick one of: ${sessions.map((x) => x.label).join(", ")}.` };
    if (found.id !== session?.id) ops.push({ op: "exam_session", id: found.id, label: "Exam session", before: session?.label ?? "Not set", after: found.label ?? sessionLabelFromId(found.id) ?? found.id });
  }
  for (const r of Array.isArray(input.levels) ? (input.levels as Record<string, unknown>[]).slice(0, 8) : []) {
    const u = mine.find((x) => x.subject.id === r.subject_id);
    const level = lvl(r.level);
    if (!u || !level) return { ok: false, reason: `Levels need one of their subject ids and HL or SL.` };
    if (u.level !== level || !u.levelSet) ops.push({ op: "level", subjectId: u.subject.id, level, label: u.subject.shortName, before: u.levelSet ? u.level : "Not set", after: level });
  }
  for (const r of Array.isArray(input.add_classes) ? (input.add_classes as Record<string, unknown>[]).slice(0, 4) : []) {
    const sub = all.find((x) => x.id === r.subject_id);
    const level = lvl(r.level) ?? "SL";
    if (!sub) return { ok: false, reason: `Unknown subject ${String(r.subject_id)}. Use an id from the syllabus list.` };
    if (mine.some((x) => x.subject.id === sub.id)) return { ok: false, reason: `They already take ${sub.shortName}.` };
    ops.push({ op: "add_class", subjectId: sub.id, level, label: "Extra class", before: "—", after: `${sub.shortName} ${level}` });
  }
  for (const id of Array.isArray(input.remove_classes) ? (input.remove_classes as unknown[]).slice(0, 4) : []) {
    const u = mine.find((x) => x.subject.id === id);
    if (!u) return { ok: false, reason: `They don't take ${String(id)}.` };
    if (u.isCore) return { ok: false, reason: `${u.subject.shortName} is one of their six subjects: swap it for another instead (swap_core).` };
    ops.push({ op: "remove_class", subjectId: u.subject.id, label: "Extra class", before: u.subject.shortName, after: "Removed" });
  }
  for (const r of Array.isArray(input.swap_core) ? (input.swap_core as Record<string, unknown>[]).slice(0, 3) : []) {
    const from = mine.find((x) => x.subject.id === r.from && x.isCore);
    const to = all.find((x) => x.id === r.to);
    if (!from) return { ok: false, reason: `${String(r.from)} isn't one of their six subjects.` };
    if (!to) return { ok: false, reason: `Unknown subject ${String(r.to)}.` };
    if (mine.some((x) => x.isCore && x.subject.id === to.id)) return { ok: false, reason: `${to.shortName} is already one of their six.` };
    const level = lvl(r.level) ?? from.level;
    ops.push({ op: "swap_core", from: from.subject.id, to: to.id, level, label: "Subject", before: `${from.subject.shortName} ${from.level}`, after: `${to.shortName} ${level}` });
  }
  if (typeof input.hide_pro_badge === "boolean" && input.hide_pro_badge !== pro.badgeHidden) {
    ops.push({ op: "pro_badge", hidden: input.hide_pro_badge, label: "Pro badge on your profile", before: pro.badgeHidden ? "Hidden" : "Shown", after: input.hide_pro_badge ? "Hidden" : "Shown" });
  }
  if (!ops.length) return { ok: false, reason: "Those settings are already like that." };
  return {
    ok: true,
    card: { type: "settings", status: "proposed", ops },
    note: `Shown as a card with an "Apply" button. Nothing changes until they tap it, so don't say it's done.${ops.some((o) => o.op === "swap_core") ? " Swapping a subject keeps their practice history; the old subject just leaves their six." : ""}`,
  };
}
