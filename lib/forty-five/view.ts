// What a game looks like to the browser: solved groups only, everything once
// it's over. Pure (no database), so guests and the dev demo share it.

import { apply, evaluate, replay, type GameState, type Group } from "./engine.ts";
import type { GuessResponse, PlayView, PublicGroup } from "./types.ts";

export const toPublic = (g: Group): PublicGroup => ({ difficulty: g.difficulty, label: g.label, words: g.words, explanation: g.explanation });

export function view(groups: Group[], s: GameState, seconds: number | null, startedAt: string | null = null): PlayView {
  const byTier = new Map(groups.map((g) => [g.difficulty as number, g]));
  return {
    guesses: s.guesses,
    mistakes: s.mistakes,
    solved: s.solved.map((d) => toPublic(byTier.get(d)!)),
    finished: s.finished,
    won: s.won,
    score: s.score,
    seconds,
    startedAt,
    reveal: s.finished ? groups.map(toPublic) : null,
  };
}

/** A guest guess: replay the browser's log, check the new guess, store nothing. */
export function guestGuess(groups: Group[], log: string[][], words: string[]): GuessResponse {
  const state = replay(groups, log);
  const ev = evaluate(groups, state, words);
  if (!ev.ok) return { ok: false, reason: ev.reason, play: view(groups, state, null) };
  const next = apply(state, words, ev);
  return { ok: true, result: ev.result, ...(ev.group ? { group: toPublic(ev.group) } : {}), play: view(groups, next, null) };
}

