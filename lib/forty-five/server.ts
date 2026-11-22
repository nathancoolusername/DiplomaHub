import "server-only";

import { cache } from "react";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { gameDay, nextResetAt } from "./dates.ts";
import { statsFrom } from "./stats.ts";
import { apply, evaluate, replay, shuffledWords, type GameState, type Group, type GuessRecord } from "./engine.ts";
import type { AllTimeRow, BoardRow, GuessResponse, MyStats, PlayView, TodayPuzzle } from "./types.ts";
import { guestGuess, toPublic, view } from "./view.ts";

// Forty-Five on the server. The puzzle tables, plays and leaderboard views
// are service-role only (migrations 34–35); everything goes through here, and
// only PlayView/PublicGroup shapes leave it — never unsolved groups.

type Puzzle = { id: string; number: number; date: string; groups: Group[] };

const admin = () => createAdminClient();

const PUZZLE_COLS = "id, number, scheduled_for, forty_five_groups (difficulty, label, words, explanation)";
type PuzzleRow = { id: string; number: number; scheduled_for: string; forty_five_groups: Group[] };

function toPuzzle(data: PuzzleRow | null): Puzzle | null {
  if (!data) return null;
  const groups = [...data.forty_five_groups].sort((a, b) => a.difficulty - b.difficulty);
  if (groups.length !== 4) return null;
  return { id: data.id, number: data.number, date: data.scheduled_for, groups };
}

/** Today's approved daily puzzle (00:00 UTC rollover), with answers. Server only. */
export const getTodayPuzzle = cache(async (): Promise<Puzzle | null> => {
  const { data, error } = await admin()
    .from("forty_five_puzzles")
    .select(PUZZLE_COLS)
    .eq("mode", "daily")
    .eq("status", "approved")
    .eq("scheduled_for", gameDay())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return toPuzzle(data as PuzzleRow | null);
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A daily puzzle that may be played: today's, or an approved one from an
 * earlier day (the archive). Never a future one. With answers; server only.
 */
export const getPlayablePuzzle = cache(async (puzzleId: string): Promise<Puzzle | null> => {
  if (!UUID_RE.test(puzzleId)) return null;
  const { data, error } = await admin()
    .from("forty_five_puzzles")
    .select(PUZZLE_COLS)
    .eq("id", puzzleId)
    .eq("mode", "daily")
    .eq("status", "approved")
    .lte("scheduled_for", gameDay())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return toPuzzle(data as PuzzleRow | null);
});

/** A past (or today's) daily puzzle by its number, for /forty-five/archive/[number]. */
export const getPuzzleByNumber = cache(async (number: number): Promise<Puzzle | null> => {
  const { data, error } = await admin()
    .from("forty_five_puzzles")
    .select(PUZZLE_COLS)
    .eq("number", number)
    .eq("mode", "daily")
    .eq("status", "approved")
    .lte("scheduled_for", gameDay())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return toPuzzle(data as PuzzleRow | null);
});

/** Today's puzzle when no id is given (the daily page), otherwise that puzzle if it's playable. */
const resolvePuzzle = (puzzleId?: string | null) => (puzzleId ? getPlayablePuzzle(puzzleId) : getTodayPuzzle());

export type ArchiveEntry = { puzzleId: string; number: number; date: string; result: { finished: boolean; score: number | null; won: boolean; counted: boolean } | null };

/** Every daily puzzle before today, newest first, with the signed-in student's result on each. */
export async function getArchive(userId: string | null): Promise<ArchiveEntry[]> {
  const sb = admin();
  const { data, error } = await sb
    .from("forty_five_puzzles")
    .select("id, number, scheduled_for")
    .eq("mode", "daily")
    .eq("status", "approved")
    .lt("scheduled_for", gameDay())
    .order("scheduled_for", { ascending: false });
  if (error) throw new Error(error.message);
  const puzzles = (data ?? []) as { id: string; number: number; scheduled_for: string }[];
  const mine = new Map<string, ArchiveEntry["result"]>();
  if (userId && puzzles.length) {
    const plays = await sb
      .from("forty_five_plays")
      .select("puzzle_id, finished_at, score, groups_found, counts_for_leaderboard")
      .eq("user_id", userId)
      .in("puzzle_id", puzzles.map((p) => p.id));
    if (plays.error) throw new Error(plays.error.message);
    for (const r of plays.data ?? [])
      mine.set(r.puzzle_id, { finished: !!r.finished_at, score: r.score, won: r.groups_found === 4, counted: r.counts_for_leaderboard });
  }
  return puzzles.map((p) => ({ puzzleId: p.id, number: p.number, date: p.scheduled_for, result: mine.get(p.id) ?? null }));
}

/** What the browser may see before playing: the 16 words, shuffled the same way for everyone. */
export function publicPuzzle(p: Puzzle): TodayPuzzle {
  return { puzzleId: p.id, number: p.number, date: p.date, words: shuffledWords(p.groups, p.id), nextResetAt: nextResetAt().toISOString(), archive: p.date < gameDay() };
}

type PlayRow = {
  id: string;
  guess_count: number;
  guesses: GuessRecord[];
  mistakes: number;
  groups_found: number;
  score: number | null;
  started_at: string;
  finished_at: string | null;
};

function stateOf(row: PlayRow): GameState {
  const guesses = row.guesses ?? [];
  const solved = guesses.filter((g) => g.result === "correct" && g.difficulty).map((g) => g.difficulty!);
  return { guesses, mistakes: row.mistakes, solved, finished: !!row.finished_at, won: solved.length === 4, score: row.score };
}

const secondsOf = (row: PlayRow) => (row.finished_at ? Math.max(0, Math.round((Date.parse(row.finished_at) - Date.parse(row.started_at)) / 1000)) : null);

const PLAY_COLS = "id, guess_count, guesses, mistakes, groups_found, score, started_at, finished_at";

export type StartResult = {
  puzzle: TodayPuzzle;
  /** Null when peeking at a puzzle the student hasn't started. */
  play: PlayView | null;
  /** Has played Forty-Five before (another puzzle), so the intro can be short. */
  returning: boolean;
  /** Database-ish "now" for the live timer, so a wrong device clock doesn't skew it. */
  serverNow: string;
};

/**
 * A puzzle for a signed-in student: today's, or `puzzleId` from the archive.
 * `begin` false only peeks (the page shows the intro first); `begin` true
 * starts the clock on the first call, and later calls change nothing. Only a
 * play started on the puzzle's own day counts for leaderboards and streaks.
 */
export async function startPlay(userId: string, begin: boolean, puzzleId?: string | null): Promise<StartResult | null> {
  const p = await resolvePuzzle(puzzleId);
  if (!p) return null;
  const sb = admin();
  if (begin) {
    const ins = await sb
      .from("forty_five_plays")
      .upsert({ user_id: userId, puzzle_id: p.id, counts_for_leaderboard: p.date === gameDay() }, { onConflict: "user_id,puzzle_id", ignoreDuplicates: true });
    if (ins.error) throw new Error(ins.error.message);
  }
  const [{ data, error }, others] = await Promise.all([
    sb.from("forty_five_plays").select(PLAY_COLS).eq("user_id", userId).eq("puzzle_id", p.id).maybeSingle(),
    sb.from("forty_five_plays").select("id", { count: "exact", head: true }).eq("user_id", userId).neq("puzzle_id", p.id),
  ]);
  if (error) throw new Error(error.message);
  const row = data as PlayRow | null;
  return {
    puzzle: publicPuzzle(p),
    play: row ? view(p.groups, stateOf(row), secondsOf(row), row.started_at) : null,
    returning: (others.count ?? 0) > 0,
    serverNow: new Date().toISOString(),
  };
}

/** A signed-in guess. `expected` is how many guesses the browser thinks are recorded (double-submits and other tabs lose). */
export async function guessSigned(userId: string, puzzleId: string, words: string[], expected: number): Promise<GuessResponse> {
  const p = await getPlayablePuzzle(puzzleId);
  if (!p) return { ok: false, reason: "no_puzzle" };
  const sb = admin();
  const { data, error } = await sb.from("forty_five_plays").select(PLAY_COLS).eq("user_id", userId).eq("puzzle_id", p.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { ok: false, reason: "stale" }; // never started: the page calls start first
  const row = data as PlayRow;
  const state = stateOf(row);
  const current = view(p.groups, state, secondsOf(row), row.started_at);
  if (row.finished_at) return { ok: false, reason: "finished", play: current };
  if (row.guess_count !== expected) return { ok: false, reason: "stale", play: current };

  const ev = evaluate(p.groups, state, words);
  if (!ev.ok) return { ok: false, reason: ev.reason, play: current };
  const next = apply(state, words, ev);
  const up = await sb
    .from("forty_five_plays")
    .update({
      guess_count: row.guess_count + 1,
      guesses: next.guesses,
      mistakes: next.mistakes,
      groups_found: next.solved.length,
      score: next.score,
      finished_at: next.finished ? new Date().toISOString() : null, // the trigger replaces this with the database clock
    })
    .eq("id", row.id)
    .eq("guess_count", row.guess_count)
    .is("finished_at", null)
    .select(PLAY_COLS)
    .maybeSingle();
  if (up.error) throw new Error(up.error.message);
  if (!up.data) return { ok: false, reason: "stale", play: current };
  const saved = up.data as PlayRow;
  return { ok: true, result: ev.result, ...(ev.group ? { group: toPublic(ev.group) } : {}), play: view(p.groups, next, secondsOf(saved), saved.started_at) };
}

/** A guest guess. Guests keep their own log in localStorage and send it each time; nothing is stored. */
export async function guessGuest(puzzleId: string, log: string[][], words: string[]): Promise<GuessResponse> {
  const p = await getPlayablePuzzle(puzzleId);
  if (!p) return { ok: false, reason: "no_puzzle" };
  return guestGuess(p.groups, log, words);
}

// ── Leaderboards ─────────────────────────────────────────────────────────

/** Ranks a page sorted best-first: equal keys share a rank (within the page). */
function rankRows<T>(rows: T[], offset: number, same: (a: T, b: T) => boolean): number[] {
  let rank = offset;
  return rows.map((r, i) => (i === 0 || !same(r, rows[i - 1]) ? (rank = offset + i + 1) : rank));
}

export async function getDailyBoard(date: string, limit: number, offset: number, meId: string | null): Promise<{ total: number; rows: BoardRow[] }> {
  type R = { user_id: string; display_name: string; score: number; seconds: number };
  const { data, error, count } = await admin()
    .from("forty_five_daily_scores")
    .select("user_id, display_name, score, seconds", { count: "exact" })
    .eq("puzzle_date", date)
    .order("score", { ascending: false })
    .order("seconds", { ascending: true })
    .order("finished_at", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as R[];
  const ranks = rankRows(rows, offset, (a, b) => a.score === b.score && a.seconds === b.seconds);
  return { total: count ?? 0, rows: rows.map((r, i) => ({ rank: ranks[i], name: r.display_name, isMe: r.user_id === meId, score: r.score, seconds: r.seconds })) };
}

export async function getAllTimeBoard(limit: number, offset: number, meId: string | null): Promise<{ total: number; rows: AllTimeRow[] }> {
  type R = { user_id: string; display_name: string; total: number; games: number; avg_score: number; reached_at: string };
  const { data, error, count } = await admin()
    .from("forty_five_alltime")
    .select("user_id, display_name, total, games, avg_score, reached_at", { count: "exact" })
    .order("total", { ascending: false })
    .order("avg_score", { ascending: false })
    .order("reached_at", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as R[];
  const ranks = rankRows(rows, offset, (a, b) => a.total === b.total && Number(a.avg_score) === Number(b.avg_score) && a.reached_at === b.reached_at);
  return {
    total: count ?? 0,
    rows: rows.map((r, i) => ({ rank: ranks[i], name: r.display_name, isMe: r.user_id === meId, total: r.total, games: r.games, average: Number(r.avg_score) })),
  };
}

async function isHidden(userId: string): Promise<boolean> {
  const { data } = await admin().from("users").select("hide_from_leaderboard").eq("id", userId).maybeSingle();
  return !!data?.hide_from_leaderboard;
}

export type DailyStanding = { played: boolean; finished: boolean; score: number | null; seconds: number | null; rank: number | null; hidden: boolean };
export type AllTimeStanding = { total: number; games: number; average: number | null; rank: number | null; hidden: boolean };

export async function getMyDailyStanding(userId: string, date: string): Promise<DailyStanding> {
  const sb = admin();
  const hidden = await isHidden(userId);
  const { data: puzzle } = await sb.from("forty_five_puzzles").select("id").eq("mode", "daily").eq("scheduled_for", date).maybeSingle();
  if (!puzzle) return { played: false, finished: false, score: null, seconds: null, rank: null, hidden };
  const { data } = await sb.from("forty_five_plays").select(`${PLAY_COLS}, counts_for_leaderboard`).eq("user_id", userId).eq("puzzle_id", puzzle.id).maybeSingle();
  if (!data) return { played: false, finished: false, score: null, seconds: null, rank: null, hidden };
  const row = data as PlayRow & { counts_for_leaderboard: boolean };
  const seconds = secondsOf(row);
  // An archive play (started after the puzzle's day) isn't on the board, so it has no rank.
  if (!row.finished_at || hidden || !row.counts_for_leaderboard || row.score == null || seconds == null) return { played: true, finished: !!row.finished_at, score: row.score, seconds, rank: null, hidden };
  const ahead = await sb
    .from("forty_five_daily_scores")
    .select("user_id", { count: "exact", head: true })
    .eq("puzzle_date", date)
    .or(`score.gt.${row.score},and(score.eq.${row.score},seconds.lt.${seconds})`);
  if (ahead.error) throw new Error(ahead.error.message);
  return { played: true, finished: true, score: row.score, seconds, rank: (ahead.count ?? 0) + 1, hidden };
}

export async function getMyAllTimeStanding(userId: string): Promise<AllTimeStanding> {
  const sb = admin();
  const hidden = await isHidden(userId);
  const { data: plays } = await sb.from("forty_five_plays").select("score").eq("user_id", userId).eq("counts_for_leaderboard", true).not("finished_at", "is", null);
  const scores = (plays ?? []).map((p) => p.score as number);
  const total = scores.reduce((a, b) => a + b, 0);
  const average = scores.length ? Math.round((total / scores.length) * 100) / 100 : null;
  if (hidden || !scores.length) return { total, games: scores.length, average, rank: null, hidden };
  const { data: me } = await sb.from("forty_five_alltime").select("total, avg_score, reached_at").eq("user_id", userId).maybeSingle();
  if (!me) return { total, games: scores.length, average, rank: null, hidden };
  const ahead = await sb
    .from("forty_five_alltime")
    .select("user_id", { count: "exact", head: true })
    .or(`total.gt.${me.total},and(total.eq.${me.total},avg_score.gt.${me.avg_score}),and(total.eq.${me.total},avg_score.eq.${me.avg_score},reached_at.lt.${me.reached_at})`);
  if (ahead.error) throw new Error(ahead.error.message);
  return { total, games: scores.length, average, rank: (ahead.count ?? 0) + 1, hidden };
}

/** Streaks, average and distribution from the student's counted daily games. */
export async function getMyStats(userId: string): Promise<MyStats> {
  const { data, error } = await admin()
    .from("forty_five_plays")
    .select("score, groups_found, forty_five_puzzles!inner (scheduled_for, mode)")
    .eq("user_id", userId)
    .eq("counts_for_leaderboard", true)
    .not("finished_at", "is", null);
  if (error) throw new Error(error.message);
  type R = { score: number; groups_found: number; forty_five_puzzles: { scheduled_for: string; mode: string } };
  const games = ((data ?? []) as unknown as R[])
    .filter((r) => r.forty_five_puzzles?.mode === "daily" && r.forty_five_puzzles.scheduled_for)
    .map((r) => ({ date: r.forty_five_puzzles.scheduled_for, score: r.score, won: r.groups_found === 4 }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return statsFrom(games, gameDay());
}


// ── Likes and guest finishes (migration 36) ──────────────────────────────

export const isGuestId = (x: unknown): x is string => typeof x === "string" && UUID_RE.test(x);

/** Counts a finished guest game for insights. The first finish per browser per puzzle wins; errors never reach the player. */
export async function recordGuestFinish(puzzleId: string, guestId: string, play: PlayView): Promise<void> {
  if (!play.finished || play.score == null) return;
  const { error } = await admin()
    .from("forty_five_guest_finishes")
    .upsert(
      { puzzle_id: puzzleId, guest_id: guestId, score: play.score, mistakes: play.mistakes, groups_found: play.solved.length, guesses: play.guesses },
      { onConflict: "puzzle_id,guest_id", ignoreDuplicates: true },
    );
  if (error) console.error("forty-five guest finish", error.message);
}

export type Reaction = "like" | "dislike" | null;
type Who = { userId: string } | { guestId: string; log: string[][] };

/**
 * 👍 / 👎 on a puzzle (today's or the archive's), or null to take it back. Only after finishing it:
 * a signed-in play with finished_at, or a guest whose guess log replays to a
 * finished game (which also records their finish, if the guess route didn't).
 */
export async function setReaction(who: Who, puzzleId: string, reaction: Reaction): Promise<"ok" | "no_puzzle" | "not_finished"> {
  const p = await getPlayablePuzzle(puzzleId);
  if (!p) return "no_puzzle";
  const sb = admin();
  if ("userId" in who) {
    const finished = await sb.from("forty_five_plays").select("id").eq("user_id", who.userId).eq("puzzle_id", p.id).not("finished_at", "is", null).maybeSingle();
    if (finished.error) throw new Error(finished.error.message);
    if (!finished.data) return "not_finished";
  } else {
    const state = replay(p.groups, who.log);
    if (!state.finished) return "not_finished";
    await recordGuestFinish(p.id, who.guestId, view(p.groups, state, null));
  }

  const key = "userId" in who ? { user_id: who.userId } : { guest_id: who.guestId };
  if (reaction === null) {
    const del = await sb.from("forty_five_reactions").delete().eq("puzzle_id", p.id).match(key);
    if (del.error) throw new Error(del.error.message);
    return "ok";
  }
  const liked = reaction === "like";
  const up = await sb.from("forty_five_reactions").update({ liked, updated_at: new Date().toISOString() }).eq("puzzle_id", p.id).match(key).select("id");
  if (up.error) throw new Error(up.error.message);
  if (!up.data?.length) {
    const ins = await sb.from("forty_five_reactions").insert({ puzzle_id: p.id, ...key, liked });
    // 23505: a double click inserted first; that row already says the same thing.
    if (ins.error && ins.error.code !== "23505") throw new Error(ins.error.message);
  }
  return "ok";
}

/** A signed-in player's 👍 / 👎 on a puzzle (guests remember theirs in the browser). */
export async function getMyReaction(userId: string, puzzleId?: string | null): Promise<Reaction> {
  const p = await resolvePuzzle(puzzleId);
  if (!p) return null;
  const { data } = await admin().from("forty_five_reactions").select("liked").eq("puzzle_id", p.id).eq("user_id", userId).maybeSingle();
  return data ? (data.liked ? "like" : "dislike") : null;
}

/** How many players liked a puzzle, today's by default (0 until migration 36 runs). */
export async function getPuzzleLikes(puzzleId?: string | null): Promise<number> {
  const p = await resolvePuzzle(puzzleId);
  if (!p) return 0;
  const { count, error } = await admin().from("forty_five_reactions").select("id", { count: "exact", head: true }).eq("puzzle_id", p.id).eq("liked", true);
  return error ? 0 : (count ?? 0);
}
