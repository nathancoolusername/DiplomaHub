// Flags: checking a finished run. Pure, so the server and the tests share it.

import { FLAGS, type Mode } from "./config.ts";

export type Answer = { code: string; ms: number };

export const isAnswerList = (x: unknown): x is Answer[] =>
  Array.isArray(x) &&
  x.length <= 260 &&
  x.every((a) => !!a && typeof a === "object" && typeof (a as Answer).code === "string" && (a as Answer).code.length <= 6 && Number.isInteger((a as Answer).ms) && (a as Answer).ms >= 0);

export type Checked = {
  /** Answers kept: on the board, each country once, in time order, none after the cap. */
  answers: Answer[];
  correct: number;
  /** Seconds the run took, as it will be ranked: the cap if it ran out, else the server's elapsed time. */
  seconds: number;
  /** False when the pace is impossible for a person typing. */
  plausible: boolean;
};

/**
 * `elapsedMs` is the server's clock (finish − start). Browser times (`ms`) are
 * only trusted for order and pace, never for the score time, and none may be
 * later than the server's elapsed time.
 */
export function checkRun(mode: Mode, board: readonly string[], sent: Answer[], elapsedMs: number): Checked {
  const capMs = FLAGS.capSeconds[mode] * 1000;
  const onBoard = new Set(board);
  const seen = new Set<string>();
  const answers: Answer[] = [];
  let last = 0;
  for (const a of sent) {
    if (!onBoard.has(a.code) || seen.has(a.code)) continue;
    if (a.ms < last || a.ms > capMs + FLAGS.graceMs || a.ms > elapsedMs + FLAGS.graceMs) continue;
    seen.add(a.code);
    answers.push(a);
    last = a.ms;
  }
  const correct = answers.length;
  const all = correct === board.length;
  const seconds = Math.min(FLAGS.capSeconds[mode], Math.max(0, Math.round((all ? elapsedMs : Math.min(elapsedMs, capMs)) / 1000)));

  let plausible = correct > 0;
  if (correct >= FLAGS.minFlagsForPace && (answers[correct - 1].ms / correct < FLAGS.minMsPerFlag || elapsedMs / correct < FLAGS.minMsPerFlag)) plausible = false;
  for (let i = 2; i < correct; i++) if (answers[i].ms - answers[i - 2].ms < FLAGS.burstWindowMs) plausible = false;
  return { answers, correct, seconds, plausible };
}

/** 72 → "1:12". */
export function formatTime(seconds: number | null): string {
  if (seconds == null) return "–";
  const m = Math.floor(seconds / 60);
  return `${m}:${String(seconds % 60).padStart(2, "0")}`;
}
