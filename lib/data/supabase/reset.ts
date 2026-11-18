import "server-only";

import type { CalendarItem, SubjectId } from "@/lib/data/types";
import type { StudentResult } from "@/lib/results";
import { findSubtopic } from "@/lib/catalog";
import { check, db, requireUserId } from "./client";
import { getUserSubjects } from "./viewer";
import { getUpcomingItems } from "./calendar";
import { getAttemptResult, getPastSets } from "./practice";
import { getPracticeStats } from "./stats";
import { getWeakestTopics } from "./strength";
import { getResults, getTestsToLog, type PastTest } from "./results";
import { getMarksWonBack } from "./squads";

// The Sunday Reset (app/hub/reset): last week, this week, and three short
// sessions for the Hub. All rules, no AI: it reads what the student already
// has (finished sets, logged results, Hub items, the strength map).

const DAY = 86_400_000;

export type LostTopic = { subjectId: SubjectId; subjectName: string; subtopicCode: string; name: string; lost: number; possible: number };

/** One proposed session. The page picks its day and time (in the student's time zone). */
export type ResetSession = {
  subjectId: SubjectId;
  subjectName: string;
  /** Empty for a plain revision block (no practice questions for it). */
  subtopicIds: string[];
  title: string;
  /** Why it's suggested, in a few words. */
  reason: string;
  minutes: number;
  /** Must happen before this (a test it prepares for), ISO; null when there's no deadline. */
  before: string | null;
};

export type WeeklyReset = {
  lastWeek: {
    answered: number;
    accuracy: number | null;
    /** Marks won back in the last 7 days; null before migration 51. */
    wonBack: number | null;
    sets: { title: string; scorePct: number | null }[];
    lost: LostTopic[];
    results: StudentResult[];
    toLog: PastTest[];
  };
  /** Tests, mocks and deadlines in the next 8 days. */
  thisWeek: CalendarItem[];
  plan: ResetSession[];
  /** Mondays (YYYY-MM-DD) of the weeks already reset, newest first (up to 8). */
  doneWeeks: string[];
};

export async function getWeeklyReset(): Promise<WeeklyReset> {
  const since = Date.now() - 7 * DAY;
  const [subjects, stats, past, results, toLog, upcoming, weakest, doneWeeks, won] = await Promise.all([
    getUserSubjects(),
    getPracticeStats(7).catch(() => null),
    getPastSets({ limit: 20 }).catch(() => []),
    getResults().catch(() => [] as StudentResult[]),
    getTestsToLog(8).catch(() => [] as PastTest[]),
    getUpcomingItems(8).catch(() => [] as CalendarItem[]),
    getWeakestTopics(2).catch(() => new Map()),
    getDoneWeeks(),
    getMarksWonBack(new Date(since).toISOString()),
  ]);
  const name = (id: string) => subjects.find((s) => s.subject.id === id)?.subject.shortName ?? id;

  // Last week's finished sets, and the marks they lost per subtopic (marked sets only, up to 8).
  const recent = past.filter((p) => p.attempt.finishedAt && new Date(p.attempt.finishedAt).getTime() >= since);
  const reviews = await Promise.all(
    recent
      .filter((p) => p.attempt.status === "marked")
      .slice(0, 8)
      .map((p) => getAttemptResult(p.attempt.id).catch(() => null)),
  );
  const lostBy = new Map<string, LostTopic>();
  for (const r of reviews) {
    if (!r) continue;
    for (const it of r.items) {
      const key = `${r.subject.id}:${it.subtopic.code}`;
      const t = lostBy.get(key) ?? { subjectId: r.subject.id, subjectName: r.subject.shortName, subtopicCode: it.subtopic.code, name: it.subtopic.shortName, lost: 0, possible: 0 };
      t.possible += it.question.totalMarks;
      t.lost += Math.max(0, it.question.totalMarks - (it.answer.marksAwarded ?? 0));
      lostBy.set(key, t);
    }
  }
  const lost = [...lostBy.values()].filter((t) => t.lost > 0).sort((a, b) => b.lost - a.lost);

  const thisWeek = upcoming.filter((i) => i.kind !== "study");
  const plan = buildPlan({ thisWeek, lost, weakest: [...weakest.values()].flat(), name, taken: new Set(subjects.map((s) => s.subject.id)) });

  return {
    lastWeek: {
      answered: stats?.answered ?? 0,
      accuracy: stats?.accuracy ?? null,
      wonBack: won ? won.wonSince : null,
      sets: recent.slice(0, 6).map((p) => ({ title: p.set.title, scorePct: p.scorePct })),
      lost: lost.slice(0, 5),
      results: results.filter((r) => new Date(`${r.takenOn}T12:00:00`).getTime() >= since).reverse(),
      toLog,
    },
    thisWeek,
    plan,
    doneWeeks,
  };
}

/**
 * Up to three sessions, most useful first:
 * 1. a test or mock this week: its subject's most-lost (else weakest) subtopic, before the test;
 * 2. last week's most-lost subtopics;
 * 3. the weakest subtopics on the strength map.
 */
function buildPlan(input: {
  thisWeek: CalendarItem[];
  lost: LostTopic[];
  weakest: { subjectId: SubjectId; subtopicCode: string; subtopicName: string; score: number }[];
  name: (id: string) => string;
  taken: Set<string>;
}): ResetSession[] {
  const out: ResetSession[] = [];
  const used = new Set<string>();
  const minutes = [25, 20, 30];
  const add = (s: Omit<ResetSession, "minutes">) => {
    const key = `${s.subjectId}:${s.subtopicIds.join(",") || s.title}`;
    if (used.has(key) || out.length >= 3) return;
    used.add(key);
    out.push({ ...s, minutes: minutes[out.length] });
  };
  const weakestFirst = [...input.weakest].sort((a, b) => a.score - b.score);

  for (const t of input.thisWeek.filter((i) => (i.kind === "test" || i.kind === "mock") && i.subjectId && input.taken.has(i.subjectId))) {
    const sid = t.subjectId as SubjectId;
    const topic = input.lost.find((l) => l.subjectId === sid) ?? null;
    const weak = topic ? null : weakestFirst.find((w) => w.subjectId === sid);
    if (topic) add({ subjectId: sid, subjectName: input.name(sid), subtopicIds: [topic.subtopicCode], title: `${topic.name}`, reason: `before your ${t.title}`, before: t.startsAt });
    else if (weak) add({ subjectId: sid, subjectName: input.name(sid), subtopicIds: [weak.subtopicCode], title: weak.subtopicName, reason: `before your ${t.title}`, before: t.startsAt });
    else add({ subjectId: sid, subjectName: input.name(sid), subtopicIds: [], title: `Revise for ${t.title}`, reason: "test this week", before: t.startsAt });
  }
  for (const l of input.lost) add({ subjectId: l.subjectId, subjectName: l.subjectName, subtopicIds: [l.subtopicCode], title: l.name, reason: `${l.lost} marks lost last week`, before: null });
  for (const w of weakestFirst) {
    const sub = findSubtopic(w.subjectId, w.subtopicCode);
    add({ subjectId: w.subjectId, subjectName: input.name(w.subjectId), subtopicIds: [w.subtopicCode], title: sub?.shortName ?? w.subtopicName, reason: "your weakest topic", before: null });
  }
  return out;
}

/** Weeks already reset (null-safe before migration 50: returns none). */
export async function getDoneWeeks(): Promise<string[]> {
  try {
    const uid = await requireUserId();
    const { data, error } = await (await db()).from("weekly_resets").select("week_start").eq("user_id", uid).order("week_start", { ascending: false }).limit(8);
    if (error) return [];
    return (data ?? []).map((r) => r.week_start as string);
  } catch {
    return [];
  }
}

/** Records this week's reset (upsert, so doing it twice is fine). */
export async function markWeeklyReset(weekStart: string, sessions: number): Promise<void> {
  const uid = await requireUserId();
  const { error } = await (await db())
    .from("weekly_resets")
    .upsert({ user_id: uid, week_start: weekStart, sessions: Math.max(0, Math.min(10, sessions)), done_at: new Date().toISOString() }, { onConflict: "user_id,week_start" });
  check(error);
}
