import type { Mode } from "./config.ts";
import type { Answer } from "./engine.ts";

/** What the page gives the game: which flags, and for the sprint which day. */
export type FlagBoard = { mode: Mode; codes: string[]; day: string | null; number: number | null; nextResetAt: string | null };

export type BoardRow = { rank: number; name: string; isMe: boolean; correct: number; total: number; seconds: number };

export type RunResult = {
  correct: number;
  total: number;
  seconds: number;
  /** On the leaderboard (signed in, plausible pace). */
  counted: boolean;
  /** Codes named, in order. */
  named: string[];
  rank: number | null;
  top: BoardRow[];
};

/** A signed-in run as the server has it. */
export type RunStart = {
  runId: string;
  startedAt: string;
  serverNow: string;
  /** Set when today's sprint is already done. */
  result: RunResult | null;
};

export type FinishRequest = { runId: string; answers: Answer[] };
