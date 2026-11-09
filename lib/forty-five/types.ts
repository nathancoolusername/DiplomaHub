// What the Forty-Five API sends the browser. Groups appear only once solved,
// or all of them once the game is over.

import type { GuessRecord } from "./engine.ts";

export type PublicGroup = { difficulty: 1 | 2 | 3 | 4; label: string; words: string[]; explanation: string };

export type TodayPuzzle = { puzzleId: string; number: number; date: string; words: string[]; nextResetAt: string };

export type PlayView = {
  guesses: GuessRecord[];
  mistakes: number;
  solved: PublicGroup[]; // in the order found
  finished: boolean;
  won: boolean;
  score: number | null;
  seconds: number | null;
  /** Every group, only when finished. */
  reveal: PublicGroup[] | null;
};

export type GuessResponse =
  | { ok: true; result: "correct" | "one_away" | "wrong"; group?: PublicGroup; play: PlayView }
  | { ok: false; reason: "invalid" | "repeat" | "finished" | "stale" | "no_puzzle" | "rate_limited" | "error"; play?: PlayView };

export type BoardRow = { rank: number; name: string; isMe: boolean; score: number; seconds: number };
export type AllTimeRow = { rank: number; name: string; isMe: boolean; total: number; games: number; average: number };

export type MyStats = {
  played: number;
  wins: number;
  streak: number;
  maxStreak: number;
  average: number | null;
  /** score → number of games, best first. */
  distribution: { score: number; count: number }[];
};
