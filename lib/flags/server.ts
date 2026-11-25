import "server-only";

import { createAdminClient } from "@/app/lib/supabase/admin";
import { ALL_CODES, HARD_CODES } from "./countries.ts";
import { FLAGS, type FreeMode, type Mode } from "./config.ts";
import { dailyCodes, gameDay, utcToday } from "./daily.ts";
import { checkRun, type Answer } from "./engine.ts";
import type { BoardRow, RunResult, RunStart } from "./types.ts";

// Flags on the server. flag_runs and its leaderboard views are service-role
// only (supabase/migrations/…_flags.sql); everything goes through here after
// the route has checked the session. The database stamps started_at and
// finished_at, so the ranked time is never the browser's.

const admin = () => createAdminClient();

type RunRow = {
  id: string;
  user_id: string;
  mode: Mode;
  day: string | null;
  started_at: string;
  finished_at: string | null;
  correct: number | null;
  total: number;
  answers: Answer[];
  counts_for_leaderboard: boolean;
};
const RUN_COLS = "id, user_id, mode, day, started_at, finished_at, correct, total, answers, counts_for_leaderboard";

const CODES: Record<FreeMode, string[]> = { all: ALL_CODES, hard: HARD_CODES };
const BEST_VIEW: Record<FreeMode, string> = { all: "flag_all_best", hard: "flag_hard_best" };
const boardFor = (run: Pick<RunRow, "mode" | "day">) => (run.mode === "daily" ? dailyCodes(run.day!) : CODES[run.mode]);
const secondsOf = (run: RunRow) => {
  const elapsed = run.finished_at ? Date.parse(run.finished_at) - Date.parse(run.started_at) : 0;
  return checkRun(run.mode, boardFor(run), run.answers ?? [], elapsed).seconds;
};

/**
 * Starts (or resumes) a signed-in run. Daily: today's one run, made on the
 * first call; later calls return it (with the result once finished). All
 * flags: the newest unfinished run if it's still inside its cap, else a new one.
 */
export async function startRun(userId: string, mode: Mode): Promise<RunStart> {
  const sb = admin();
  let row: RunRow | null = null;
  if (mode === "daily") {
    const day = gameDay();
    // FLAGS_TODAY (dev only) previews another day's board. Dev shares the live
    // database, so never save a sprint for a day that isn't really today.
    if (day !== utcToday()) throw new Error(`flags: FLAGS_TODAY=${day} is a preview; sprint runs aren't saved`);
    const ins = await sb
      .from("flag_runs")
      .upsert({ user_id: userId, mode, day, total: dailyCodes(day).length, counts_for_leaderboard: false }, { onConflict: "user_id,day", ignoreDuplicates: true });
    if (ins.error) throw new Error(ins.error.message);
    const { data, error } = await sb.from("flag_runs").select(RUN_COLS).eq("user_id", userId).eq("mode", "daily").eq("day", day).maybeSingle();
    if (error) throw new Error(error.message);
    row = data as RunRow | null;
  } else {
    const { data, error } = await sb
      .from("flag_runs")
      .select(RUN_COLS)
      .eq("user_id", userId)
      .eq("mode", mode)
      .is("finished_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const open = data as RunRow | null;
    const live = open && Date.now() - Date.parse(open.started_at) < FLAGS.capSeconds[mode] * 1000 + FLAGS.graceMs;
    if (live) row = open;
    else {
      // Abandoned runs never count; clear them so they don't pile up.
      const del = await sb.from("flag_runs").delete().eq("user_id", userId).eq("mode", mode).is("finished_at", null);
      if (del.error) throw new Error(del.error.message);
      const ins = await sb.from("flag_runs").insert({ user_id: userId, mode, total: CODES[mode].length }).select(RUN_COLS).single();
      if (ins.error) throw new Error(ins.error.message);
      row = ins.data as RunRow;
    }
  }
  if (!row) throw new Error("flags: run not created");
  return {
    runId: row.id,
    startedAt: row.started_at,
    serverNow: new Date().toISOString(),
    result: row.finished_at ? await resultOf(row) : null,
  };
}

export type FinishOutcome = { ok: true; result: RunResult } | { ok: false; reason: "no_run" };

/** Finishes a run with the browser's answers. Finishing twice returns the first result. */
export async function finishRun(userId: string, runId: string, sent: Answer[]): Promise<FinishOutcome> {
  const sb = admin();
  const { data, error } = await sb.from("flag_runs").select(RUN_COLS).eq("id", runId).eq("user_id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as RunRow | null;
  if (!row) return { ok: false, reason: "no_run" };
  if (row.finished_at) return { ok: true, result: await resultOf(row) };

  const board = boardFor(row);
  const elapsed = Date.now() - Date.parse(row.started_at);
  const checked = checkRun(row.mode, board, sent, elapsed);
  // A sprint can only be started on its own day (startRun), so one begun just
  // before midnight UTC still counts when it ends just after.
  const counted = checked.plausible;
  const up = await sb
    .from("flag_runs")
    .update({ correct: checked.correct, answers: checked.answers, counts_for_leaderboard: counted, finished_at: new Date().toISOString() }) // the trigger sets the database clock
    .eq("id", row.id)
    .is("finished_at", null)
    .select(RUN_COLS)
    .maybeSingle();
  if (up.error) throw new Error(up.error.message);
  if (!up.data) {
    // Another tab finished it first.
    const again = await sb.from("flag_runs").select(RUN_COLS).eq("id", row.id).single();
    if (again.error) throw new Error(again.error.message);
    return { ok: true, result: await resultOf(again.data as RunRow) };
  }
  return { ok: true, result: await resultOf(up.data as RunRow) };
}

async function resultOf(row: RunRow): Promise<RunResult> {
  const seconds = secondsOf(row);
  const correct = row.correct ?? 0;
  const [top, rank] = await Promise.all([
    row.mode === "daily" ? getDailyBoard(row.day!, 10, 0, row.user_id).then((b) => b.rows) : getBestBoard(row.mode, 10, 0, row.user_id).then((b) => b.rows),
    row.counts_for_leaderboard ? rankOf(row.user_id, row.mode, row.day, correct, seconds) : Promise.resolve(null),
  ]);
  return { correct, total: row.total, seconds, counted: row.counts_for_leaderboard, named: (row.answers ?? []).map((a) => a.code), rank, top };
}

// ── Leaderboards ─────────────────────────────────────────────────────────

function rankRows<T>(rows: T[], offset: number, same: (a: T, b: T) => boolean): number[] {
  let rank = offset;
  return rows.map((r, i) => (i === 0 || !same(r, rows[i - 1]) ? (rank = offset + i + 1) : rank));
}

type ScoreRow = { user_id: string; display_name: string; correct: number; total: number; seconds: number };

function toRows(rows: ScoreRow[], offset: number, meId: string | null): BoardRow[] {
  const ranks = rankRows(rows, offset, (a, b) => a.correct === b.correct && a.seconds === b.seconds);
  return rows.map((r, i) => ({ rank: ranks[i], name: r.display_name, isMe: r.user_id === meId, correct: r.correct, total: r.total, seconds: r.seconds }));
}

export async function getDailyBoard(day: string, limit: number, offset: number, meId: string | null): Promise<{ total: number; rows: BoardRow[] }> {
  const { data, error, count } = await admin()
    .from("flag_daily_scores")
    .select("user_id, display_name, correct, total, seconds", { count: "exact" })
    .eq("day", day)
    .order("correct", { ascending: false })
    .order("seconds", { ascending: true })
    .order("finished_at", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return { total: count ?? 0, rows: toRows((data ?? []) as ScoreRow[], offset, meId) };
}

/** Best run per student for a replayable mode (all flags, or hard). */
export async function getBestBoard(mode: FreeMode, limit: number, offset: number, meId: string | null): Promise<{ total: number; rows: BoardRow[] }> {
  const { data, error, count } = await admin()
    .from(BEST_VIEW[mode])
    .select("user_id, display_name, correct, total, seconds", { count: "exact" })
    .order("correct", { ascending: false })
    .order("seconds", { ascending: true })
    .order("finished_at", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return { total: count ?? 0, rows: toRows((data ?? []) as ScoreRow[], offset, meId) };
}

async function rankOf(userId: string, mode: Mode, day: string | null, correct: number, seconds: number): Promise<number | null> {
  const sb = admin();
  const { data: me } = await sb.from("users").select("hide_from_leaderboard").eq("id", userId).maybeSingle();
  if (me?.hide_from_leaderboard) return null;
  const view = mode === "daily" ? "flag_daily_scores" : BEST_VIEW[mode];
  let q = sb.from(view).select("user_id", { count: "exact", head: true }).or(`correct.gt.${correct},and(correct.eq.${correct},seconds.lt.${seconds})`);
  if (mode === "daily") q = q.eq("day", day!);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return (count ?? 0) + 1;
}

export type Standing = { hidden: boolean; played: boolean; correct: number | null; total: number | null; seconds: number | null; rank: number | null };

/** The signed-in student's line above a board: today's sprint, or their best all-flags run. */
export async function getMyStanding(userId: string, mode: Mode): Promise<Standing> {
  const sb = admin();
  const { data: u } = await sb.from("users").select("hide_from_leaderboard").eq("id", userId).maybeSingle();
  const hidden = !!u?.hide_from_leaderboard;
  let q = sb.from("flag_runs").select(RUN_COLS).eq("user_id", userId).eq("mode", mode).not("finished_at", "is", null);
  if (mode === "daily") q = q.eq("day", gameDay());
  else q = q.eq("counts_for_leaderboard", true).order("correct", { ascending: false });
  const { data, error } = await q.limit(mode === "daily" ? 1 : 50);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as RunRow[];
  if (!rows.length) return { hidden, played: false, correct: null, total: null, seconds: null, rank: null };
  const best = rows
    .map((r) => ({ r, s: secondsOf(r) }))
    .sort((a, b) => (b.r.correct ?? 0) - (a.r.correct ?? 0) || a.s - b.s)[0];
  const rank = best.r.counts_for_leaderboard && !hidden ? await rankOf(userId, mode, best.r.day, best.r.correct ?? 0, best.s) : null;
  return { hidden, played: true, correct: best.r.correct, total: best.r.total, seconds: best.s, rank };
}
