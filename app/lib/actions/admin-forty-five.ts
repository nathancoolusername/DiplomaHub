"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { isAdmin } from "../admin";
import type { ActionResult } from "../types";
import { checkBank, checkPuzzle, type CheckResult } from "@/lib/forty-five/checks";
import type { GroupSubject, SourceGroup, SourcePuzzle, SourceTrap, Subject } from "@/lib/forty-five/format";
import { LAUNCH_DATE, utcToday, addDays } from "@/lib/forty-five/dates";
import { hasMixedFinal, scheduleOrder } from "@/lib/forty-five/schedule";

// Admin → Forty-Five (migration 34). The puzzle tables are service-role only,
// so everything here runs on the admin client after the admin check.

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.id)) return null;
  return createAdminClient();
}

export type FortyFiveStatus = "draft" | "approved" | "rejected";

export type AdminFortyFivePuzzle = {
  id: string;
  slug: string;
  mode: "daily" | "subject";
  subject: Subject | null;
  status: FortyFiveStatus;
  scheduledFor: string | null;
  number: number | null;
  reviewNote: string | null;
  traps: SourceTrap[];
  groups: SourceGroup[];
  check: CheckResult;
  /** Scheduled for today or earlier: players have seen it, so it can't be edited or pulled. */
  live: boolean;
};

export type FortyFiveAdminData = {
  puzzles: AdminFortyFivePuzzle[];
  today: string;
  counts: Record<FortyFiveStatus, number> & { scheduled: number; readyToSchedule: number };
  /** Last scheduled date, or null. */
  scheduledUntil: string | null;
};

type PuzzleRow = {
  id: string;
  slug: string;
  mode: "daily" | "subject";
  subject: Subject | null;
  status: FortyFiveStatus;
  scheduled_for: string | null;
  number: number | null;
  review_note: string | null;
  traps: SourceTrap[];
  forty_five_groups: { difficulty: 1 | 2 | 3 | 4; label: string; subject: GroupSubject; words: string[]; explanation: string }[];
};

function toSource(r: PuzzleRow): SourcePuzzle {
  const groups = [...r.forty_five_groups].sort((a, b) => a.difficulty - b.difficulty);
  return {
    slug: r.slug,
    mode: r.mode,
    subject: r.subject,
    traps: r.traps ?? [],
    groups: groups.map((g) => ({ ...g, words: g.words as SourceGroup["words"] })) as SourcePuzzle["groups"],
  };
}

export async function getFortyFiveAdminData(): Promise<ActionResult<FortyFiveAdminData>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const { data, error } = await admin
    .from("forty_five_puzzles")
    .select("id, slug, mode, subject, status, scheduled_for, number, review_note, traps, forty_five_groups (difficulty, label, subject, words, explanation)")
    .order("slug");
  if (error) return { success: false, error: error.message };

  const rows = (data ?? []) as unknown as PuzzleRow[];
  const sources = rows.map(toSource);
  const checks = checkBank(sources);
  const today = utcToday();
  const puzzles: AdminFortyFivePuzzle[] = rows.map((r, i) => ({
    id: r.id,
    slug: r.slug,
    mode: r.mode,
    subject: r.subject,
    status: r.status,
    scheduledFor: r.scheduled_for,
    number: r.number,
    reviewNote: r.review_note,
    traps: r.traps ?? [],
    groups: sources[i].groups,
    check: checks.get(r.slug) ?? { errors: [], warnings: [] },
    live: !!r.scheduled_for && r.scheduled_for <= today,
  }));
  const count = (s: FortyFiveStatus) => puzzles.filter((p) => p.status === s).length;
  const scheduled = puzzles.filter((p) => p.scheduledFor).map((p) => p.scheduledFor!).sort();
  return {
    success: true,
    data: {
      puzzles,
      today,
      counts: {
        draft: count("draft"),
        approved: count("approved"),
        rejected: count("rejected"),
        scheduled: scheduled.length,
        readyToSchedule: puzzles.filter((p) => p.status === "approved" && p.mode === "daily" && !p.scheduledFor && !p.check.errors.length).length,
      },
      scheduledUntil: scheduled.at(-1) ?? null,
    },
  };
}

async function loadOne(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { data, error } = await admin
    .from("forty_five_puzzles")
    .select("id, slug, mode, subject, status, scheduled_for, number, review_note, traps, forty_five_groups (difficulty, label, subject, words, explanation)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as PuzzleRow | null;
}

/** Approve, reject or send back to draft. Approving needs zero validator errors. */
export async function reviewFortyFive(id: string, status: FortyFiveStatus, note?: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const row = await loadOne(admin, id);
  if (!row) return { success: false, error: "Puzzle not found" };
  if (row.scheduled_for && row.scheduled_for <= utcToday()) return { success: false, error: "This puzzle has already been played, so it can't change status." };
  if (status === "approved") {
    const { errors } = checkPuzzle(toSource(row));
    if (errors.length) return { success: false, error: `Fix these first: ${errors.join("; ")}` };
  }
  const { error } = await admin
    .from("forty_five_puzzles")
    .update({
      status,
      // Only approved puzzles stay on the calendar.
      ...(status === "approved" ? {} : { scheduled_for: null }),
      review_note: note?.trim() ? note.trim().slice(0, 2000) : row.review_note,
      reviewed_at: status === "draft" ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/forty-five");
  return { success: true, data: null };
}

/** Inline edit: replaces the four groups. Refused if the result has validator errors or the puzzle is live. */
export async function saveFortyFiveGroups(id: string, groups: SourceGroup[]): Promise<ActionResult<CheckResult>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const row = await loadOne(admin, id);
  if (!row) return { success: false, error: "Puzzle not found" };
  if (row.scheduled_for && row.scheduled_for <= utcToday()) return { success: false, error: "This puzzle has already been played, so it can't be edited." };

  const cleaned = groups.map((g) => ({
    difficulty: Number(g.difficulty) as SourceGroup["difficulty"],
    label: String(g.label ?? "").trim(),
    subject: g.subject,
    words: (g.words ?? []).map((w) => String(w ?? "").trim()) as SourceGroup["words"],
    explanation: String(g.explanation ?? "").trim(),
  }));
  const next: SourcePuzzle = { ...toSource(row), groups: cleaned as SourcePuzzle["groups"] };
  const check = checkPuzzle(next);
  if (check.errors.length) return { success: false, error: check.errors.join("; ") };

  const del = await admin.from("forty_five_groups").delete().eq("puzzle_id", id);
  if (del.error) return { success: false, error: del.error.message };
  const ins = await admin.from("forty_five_groups").insert(cleaned.map((g) => ({ ...g, puzzle_id: id })));
  if (ins.error) return { success: false, error: `${ins.error.message} (groups were cleared; save again)` };
  await admin.from("forty_five_puzzles").update({ updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/forty-five");
  return { success: true, data: check };
}

/**
 * Puts every approved, unscheduled daily puzzle on the next
 * free dates, from today (or launch day, if later), in scheduleOrder():
 * d-001 first, then 4 Mixed-final puzzles per other one. The number follows from
 * the date (migration 34: 2026-11-10 is #1). Puzzles with errors are skipped.
 */
export async function scheduleFortyFive(): Promise<ActionResult<{ scheduled: number; from: string | null; to: string | null }>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const { data, error } = await admin
    .from("forty_five_puzzles")
    .select("id, slug, mode, subject, status, scheduled_for, number, review_note, traps, forty_five_groups (difficulty, label, subject, words, explanation)")
    .eq("mode", "daily")
    .order("slug");
  if (error) return { success: false, error: error.message };
  const rows = (data ?? []) as unknown as PuzzleRow[];

  const taken = new Set(rows.map((r) => r.scheduled_for).filter(Boolean) as string[]);
  const queue = scheduleOrder(
    rows
      .filter((r) => r.status === "approved" && !r.scheduled_for && !checkPuzzle(toSource(r)).errors.length)
      .map((r) => ({ ...r, mixedFinal: hasMixedFinal(r.forty_five_groups) })),
  );
  const today = utcToday();
  let day = today > LAUNCH_DATE ? today : LAUNCH_DATE;
  const done: string[] = [];
  for (const r of queue) {
    while (taken.has(day)) day = addDays(day, 1);
    // Guard on scheduled_for still being empty, in case another tab scheduled it.
    const up = await admin.from("forty_five_puzzles").update({ scheduled_for: day, updated_at: new Date().toISOString() }).eq("id", r.id).is("scheduled_for", null).eq("status", "approved");
    if (up.error) return { success: false, error: `${r.slug}: ${up.error.message} (${done.length} scheduled before this)` };
    taken.add(day);
    done.push(day);
  }
  revalidatePath("/admin/forty-five");
  return { success: true, data: { scheduled: done.length, from: done[0] ?? null, to: done.at(-1) ?? null } };
}

/** Takes a future puzzle off the calendar (it stays approved). */
export async function unscheduleFortyFive(id: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const row = await loadOne(admin, id);
  if (!row?.scheduled_for) return { success: false, error: "Not scheduled" };
  if (row.scheduled_for <= utcToday()) return { success: false, error: "Today's and past puzzles stay on the calendar." };
  const { error } = await admin.from("forty_five_puzzles").update({ scheduled_for: null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/forty-five");
  return { success: true, data: null };
}

// ── Insights (migrations 35–36) ──────────────────────────────────────────

type Tier = 1 | 2 | 3 | 4;

export type FortyFivePuzzleInsight = {
  slug: string;
  number: number;
  date: string;
  /** Signed-in players who opened it, and how many of them finished. */
  opened: number;
  finishedSigned: number;
  finishedGuest: number;
  winRate: number | null;
  flawlessRate: number | null;
  averageScore: number | null;
  /** Median minutes:seconds of signed-in finishes (guest times aren't recorded). */
  medianSeconds: number | null;
  likes: number;
  dislikes: number;
  /** Share of finishers who solved each group, easiest tier first. */
  groups: { difficulty: Tier; label: string; solveRate: number | null }[];
  oneAways: number;
};

export type FortyFiveInsights = {
  today: string;
  puzzles: FortyFivePuzzleInsight[]; // newest first
  totals: {
    finishes: number;
    finishesSigned: number;
    finishesGuest: number;
    signedPlayers: number;
    returningPlayers: number;
    likes: number;
    dislikes: number;
    averageScore: number | null;
    winRate: number | null;
  };
  scoreDistribution: { score: number; count: number }[];
  /** Per puzzle day, oldest first, for the chart. */
  series: { date: string; signed: number; guest: number }[];
  /** False until migration 36 runs: likes and guests read as zero. */
  feedbackReady: boolean;
};

type Finish = { puzzle_id: string; score: number; mistakes: number; groups_found: number; guesses: { result: string; difficulty?: number }[] };

/** Reads every row (PostgREST caps a request at 1,000). */
async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw Object.assign(new Error(error.message), { code: error.code });
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
const rate = (part: number, whole: number) => (whole ? part / whole : null);
function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export async function getFortyFiveInsights(): Promise<ActionResult<FortyFiveInsights>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const today = utcToday();
  try {
    type P = { id: string; slug: string; number: number; scheduled_for: string; forty_five_groups: { difficulty: Tier; label: string }[] };
    type Play = Finish & { user_id: string; started_at: string; finished_at: string | null; counts_for_leaderboard: boolean };
    const [puzzles, plays] = await Promise.all([
      all<P>((a, b) =>
        admin.from("forty_five_puzzles").select("id, slug, number, scheduled_for, forty_five_groups (difficulty, label)").eq("mode", "daily").not("scheduled_for", "is", null).lte("scheduled_for", today).order("scheduled_for").range(a, b),
      ),
      all<Play>((a, b) => admin.from("forty_five_plays").select("puzzle_id, user_id, started_at, finished_at, score, mistakes, groups_found, guesses, counts_for_leaderboard").order("id").range(a, b)),
    ]);
    // Migration 36 tables: missing (42P01 / PGRST205) means not run yet, so count nothing.
    let feedbackReady = true;
    const optional = async <T,>(f: () => Promise<T[]>): Promise<T[]> => {
      try {
        return await f();
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code === "PGRST205" || code === "42P01") {
          feedbackReady = false;
          return [];
        }
        throw e;
      }
    };
    const [guests, reactions] = await Promise.all([
      optional(() => all<Finish>((a, b) => admin.from("forty_five_guest_finishes").select("puzzle_id, score, mistakes, groups_found, guesses").order("id").range(a, b))),
      optional(() => all<{ puzzle_id: string; liked: boolean }>((a, b) => admin.from("forty_five_reactions").select("puzzle_id, liked").order("id").range(a, b))),
    ]);

    const by = <T extends { puzzle_id: string }>(rows: T[]) => {
      const m = new Map<string, T[]>();
      for (const r of rows) m.set(r.puzzle_id, [...(m.get(r.puzzle_id) ?? []), r]);
      return m;
    };
    const playsBy = by(plays);
    const guestsBy = by(guests);
    const reactionsBy = by(reactions);

    const insights: FortyFivePuzzleInsight[] = puzzles.map((p) => {
      const opened = playsBy.get(p.id) ?? [];
      const signed = opened.filter((r) => r.finished_at && r.score != null);
      const guest = guestsBy.get(p.id) ?? [];
      const finishes: Finish[] = [...signed, ...guest];
      const rs = reactionsBy.get(p.id) ?? [];
      const solvedBy = (d: number) => finishes.filter((f) => f.guesses.some((g) => g.result === "correct" && g.difficulty === d)).length;
      return {
        slug: p.slug,
        number: p.number,
        date: p.scheduled_for,
        opened: opened.length,
        finishedSigned: signed.length,
        finishedGuest: guest.length,
        winRate: rate(finishes.filter((f) => f.groups_found === 4).length, finishes.length),
        flawlessRate: rate(finishes.filter((f) => f.groups_found === 4 && f.mistakes === 0).length, finishes.length),
        averageScore: avg(finishes.map((f) => f.score)),
        medianSeconds: median(signed.map((r) => Math.max(0, Math.round((Date.parse(r.finished_at!) - Date.parse(r.started_at)) / 1000)))),
        likes: rs.filter((r) => r.liked).length,
        dislikes: rs.filter((r) => !r.liked).length,
        groups: [...p.forty_five_groups].sort((a, b) => a.difficulty - b.difficulty).map((g) => ({ difficulty: g.difficulty, label: g.label, solveRate: rate(solvedBy(g.difficulty), finishes.length) })),
        oneAways: finishes.reduce((n, f) => n + f.guesses.filter((g) => g.result === "one_away").length, 0),
      };
    });

    const live = new Set(puzzles.map((p) => p.id));
    const allFinishes: Finish[] = [...plays.filter((r) => r.finished_at && r.score != null && live.has(r.puzzle_id)), ...guests.filter((g) => live.has(g.puzzle_id))];
    const perUser = new Map<string, number>();
    for (const r of plays) if (r.finished_at && r.counts_for_leaderboard) perUser.set(r.user_id, (perUser.get(r.user_id) ?? 0) + 1);
    const dist = new Map<number, number>();
    for (const f of allFinishes) dist.set(f.score, (dist.get(f.score) ?? 0) + 1);

    return {
      success: true,
      data: {
        today,
        feedbackReady,
        puzzles: [...insights].reverse(),
        totals: {
          finishes: allFinishes.length,
          finishesSigned: insights.reduce((n, p) => n + p.finishedSigned, 0),
          finishesGuest: insights.reduce((n, p) => n + p.finishedGuest, 0),
          signedPlayers: new Set(plays.map((r) => r.user_id)).size,
          returningPlayers: [...perUser.values()].filter((n) => n >= 2).length,
          likes: reactions.filter((r) => r.liked).length,
          dislikes: reactions.filter((r) => !r.liked).length,
          averageScore: avg(allFinishes.map((f) => f.score)),
          winRate: rate(allFinishes.filter((f) => f.groups_found === 4).length, allFinishes.length),
        },
        scoreDistribution: [...dist.entries()].map(([score, count]) => ({ score, count })).sort((a, b) => b.score - a.score),
        series: insights.map((p) => ({ date: p.date, signed: p.finishedSigned, guest: p.finishedGuest })),
      },
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
