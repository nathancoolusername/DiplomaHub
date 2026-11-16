import "server-only";

import { createAdminClient } from "@/app/lib/supabase/admin";
import { toCatalogSubjectId } from "@/lib/hub-subjects";
import { checkResult, type ResultInput, type StudentResult } from "@/lib/results";
import { checkBounds, type Bounds } from "@/lib/grade-boundaries";
import { check, db, requireUserId } from "./client";
import { getUserSubjects } from "./viewer";

// Progress ─ student_results (migration 41). Students read and write their
// own rows through RLS; checkResult() cleans every write first. Bro's
// record_result tool writes with the service role for the signed-in student.

const COLUMNS = "id, subject_id, title, kind, taken_on, grade, marks, max_marks, percent, hub_item_id, note, source";

type Row = {
  id: string;
  subject_id: string;
  title: string;
  kind: StudentResult["kind"];
  taken_on: string;
  grade: number | null;
  marks: string | number | null;
  max_marks: string | number | null;
  percent: string | number | null;
  hub_item_id: string | null;
  note: string | null;
  source: StudentResult["source"];
};

const n = (v: string | number | null) => (v === null ? null : Number(v));
const toResult = (r: Row): StudentResult => ({
  id: r.id,
  subjectId: r.subject_id,
  title: r.title,
  kind: r.kind,
  takenOn: r.taken_on,
  grade: r.grade,
  marks: n(r.marks),
  maxMarks: n(r.max_marks),
  percent: n(r.percent),
  hubItemId: r.hub_item_id,
  note: r.note,
  source: r.source,
});

const toRow = (v: Exclude<ReturnType<typeof checkResult>, { ok: false }>["value"]) => ({
  subject_id: v.subjectId,
  title: v.title,
  kind: v.kind,
  taken_on: v.takenOn,
  grade: v.grade,
  marks: v.marks,
  max_marks: v.maxMarks,
  percent: v.percent,
  hub_item_id: v.hubItemId,
  note: v.note,
});

export type ResultWrite = { ok: true; result: StudentResult } | { ok: false; reason: string };

/** Every result the signed-in student logged, oldest first (for charts). */
export async function getResults(): Promise<StudentResult[]> {
  const uid = await requireUserId();
  const { data, error } = await (await db()).from("student_results").select(COLUMNS).eq("user_id", uid).order("taken_on").order("created_at").limit(2000);
  check(error);
  return ((data ?? []) as Row[]).map(toResult);
}

async function subjectIds(): Promise<string[]> {
  return (await getUserSubjects()).map((s) => s.subject.id);
}

/** A Hub item id is only kept when it's the student's own. */
async function ownHubItem(uid: string, id: string | null): Promise<string | null> {
  if (!id) return null;
  const { data } = await (await db()).from("hub_items").select("id").eq("id", id).eq("owner_id", uid).maybeSingle();
  return data ? id : null;
}

function friendly(message: string): string {
  return message.includes("student_results_one_per_hub_item") ? "You've already logged a result for that test." : "Couldn't save that. Try again?";
}

export async function addResult(input: Partial<Record<keyof ResultInput, unknown>>, source: "student" | "bro" = "student", userId?: string): Promise<ResultWrite> {
  const uid = userId ?? (await requireUserId());
  const c = checkResult(input, await subjectIds());
  if (!c.ok) return c;
  const row = { ...toRow(c.value), hub_item_id: await ownHubItem(uid, c.value.hubItemId), user_id: uid, source };
  // Bro writes from the chat route with the service role; the student writes as themselves (RLS).
  const client = source === "bro" ? createAdminClient() : await db();
  const { data, error } = await client.from("student_results").insert(row).select(COLUMNS).single();
  if (error) return { ok: false, reason: friendly(error.message) };
  return { ok: true, result: toResult(data as Row) };
}

export async function updateResult(id: string, input: Partial<Record<keyof ResultInput, unknown>>): Promise<ResultWrite> {
  const uid = await requireUserId();
  const c = checkResult(input, await subjectIds());
  if (!c.ok) return c;
  const row = { ...toRow(c.value), hub_item_id: await ownHubItem(uid, c.value.hubItemId), updated_at: new Date().toISOString() };
  const { data, error } = await (await db()).from("student_results").update(row).eq("id", id).eq("user_id", uid).select(COLUMNS).maybeSingle();
  if (error) return { ok: false, reason: friendly(error.message) };
  if (!data) return { ok: false, reason: "That result is gone." };
  return { ok: true, result: toResult(data as Row) };
}

export async function deleteResult(id: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await (await db()).from("student_results").delete().eq("id", id).eq("user_id", uid);
  check(error);
}

export type PastTest = { hubItemId: string; title: string; subjectId: string | null; kind: "test" | "mock"; date: string };

/**
 * Tests and mocks on the student's Hub from the last 21 days with no result
 * yet: the "How did it go?" prompts on /progress.
 */
export async function getTestsToLog(days = 21): Promise<PastTest[]> {
  const uid = await requireUserId();
  const now = new Date();
  const from = new Date(now.getTime() - days * 86_400_000);
  const sb = await db();
  const [subjects, items, logged] = await Promise.all([
    getUserSubjects(),
    sb
      .from("hub_items")
      .select("id, title, subject_id, start_at, kind")
      .eq("owner_id", uid)
      .in("kind", ["test", "mock"])
      .gte("start_at", from.toISOString())
      .lte("start_at", now.toISOString())
      .order("start_at", { ascending: false })
      .limit(20),
    sb.from("student_results").select("hub_item_id").eq("user_id", uid).not("hub_item_id", "is", null),
  ]);
  check(items.error);
  check(logged.error);
  const done = new Set((logged.data ?? []).map((r) => r.hub_item_id as string));
  const taken = subjects.map((s) => s.subject.id);
  return (items.data ?? [])
    .filter((i) => !done.has(i.id as string))
    .map((i) => ({
      hubItemId: i.id as string,
      title: i.title as string,
      subjectId: i.subject_id ? toCatalogSubjectId(i.subject_id as string, taken) : null,
      kind: i.kind as "test" | "mock",
      date: (i.start_at as string).slice(0, 10),
    }));
}

export type PracticeWeek = { week: string; score: number; max: number; questions: number };
export type PracticeSubject = {
  subjectId: string;
  /** Marks earned / possible in the last 30 days; null when nothing then. */
  last30: { score: number; max: number; questions: number } | null;
  total: { score: number; max: number; questions: number };
  /** One point per week with practice (Monday, UTC), oldest first, up to 26 weeks back. */
  weeks: PracticeWeek[];
};

function mondayOf(iso: string): string {
  const d = new Date(iso);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/**
 * Practice progress per subject for /progress, from practice_activity (one
 * row per marked question): percentages over the last 26 weeks.
 */
export async function getPracticeProgress(): Promise<PracticeSubject[]> {
  const uid = await requireUserId();
  const since = new Date(Date.now() - 26 * 7 * 86_400_000).toISOString();
  const { data, error } = await (await db())
    .from("practice_activity")
    .select("subject, score, max_score, created_at")
    .eq("user_id", uid)
    .gte("created_at", since)
    .order("created_at")
    .limit(10000);
  check(error);
  const cut = Date.now() - 30 * 86_400_000;
  const out = new Map<string, PracticeSubject & { byWeek: Map<string, PracticeWeek> }>();
  for (const r of (data ?? []) as { subject: string; score: number; max_score: number; created_at: string }[]) {
    let s = out.get(r.subject);
    if (!s) {
      s = { subjectId: r.subject, last30: null, total: { score: 0, max: 0, questions: 0 }, weeks: [], byWeek: new Map() };
      out.set(r.subject, s);
    }
    s.total.score += r.score;
    s.total.max += r.max_score;
    s.total.questions++;
    if (Date.parse(r.created_at) >= cut) {
      s.last30 ??= { score: 0, max: 0, questions: 0 };
      s.last30.score += r.score;
      s.last30.max += r.max_score;
      s.last30.questions++;
    }
    const w = mondayOf(r.created_at);
    const wk = s.byWeek.get(w) ?? { week: w, score: 0, max: 0, questions: 0 };
    wk.score += r.score;
    wk.max += r.max_score;
    wk.questions++;
    s.byWeek.set(w, wk);
  }
  return [...out.values()].map(({ byWeek, ...s }) => ({ ...s, weeks: [...byWeek.values()].sort((a, b) => a.week.localeCompare(b.week)) }));
}

/** The student's own grade boundaries per subject (student_boundaries, migration 42). */
export async function getBoundaryOverrides(): Promise<Record<string, Bounds>> {
  const uid = await requireUserId();
  const { data, error } = await (await db()).from("student_boundaries").select("subject_id, bounds").eq("user_id", uid);
  check(error);
  const out: Record<string, Bounds> = {};
  for (const r of data ?? []) {
    const b = checkBounds(r.bounds);
    if (b) out[r.subject_id as string] = b;
  }
  return out;
}

/** Saves a subject's boundaries (null = back to the IB's). */
export async function setBoundaryOverride(subjectId: string, bounds: Bounds | null): Promise<void> {
  const uid = await requireUserId();
  const sb = await db();
  if (bounds === null) {
    const { error } = await sb.from("student_boundaries").delete().eq("user_id", uid).eq("subject_id", subjectId);
    check(error);
    return;
  }
  const { error } = await sb
    .from("student_boundaries")
    .upsert({ user_id: uid, subject_id: subjectId, bounds, updated_at: new Date().toISOString() }, { onConflict: "user_id,subject_id" });
  check(error);
}
