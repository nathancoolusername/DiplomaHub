// Forty-Five game rules. Pure functions, used only on the server (route
// handlers) with the real groups, so nothing here ever reaches the browser
// with answers in it.

import { FORTY_FIVE, scoreFor } from "./config.ts";
import { normWord } from "./checks.ts";

export type Group = { difficulty: 1 | 2 | 3 | 4; label: string; words: string[]; explanation: string };
export type GuessResult = "correct" | "one_away" | "wrong";
export type GuessRecord = { words: string[]; result: GuessResult; difficulty?: number };

export type GameState = {
  guesses: GuessRecord[];
  mistakes: number;
  solved: number[]; // difficulties, in the order found
  finished: boolean;
  won: boolean;
  score: number | null;
};

export const emptyState = (): GameState => ({ guesses: [], mistakes: 0, solved: [], finished: false, won: false, score: null });

const key = (words: string[]) => words.map(normWord).sort().join("|");

export type Evaluation =
  | { ok: true; result: GuessResult; group?: Group }
  | { ok: false; reason: "invalid" | "repeat" | "finished" };

/** Checks one guess against the groups and the game so far. Doesn't change state. */
export function evaluate(groups: Group[], state: GameState, words: string[]): Evaluation {
  if (state.finished) return { ok: false, reason: "finished" };
  const all = new Map(groups.flatMap((g) => g.words.map((w) => [normWord(w), g] as const)));
  const picked = words.map(normWord);
  if (picked.length !== 4 || new Set(picked).size !== 4 || picked.some((w) => !all.has(w))) return { ok: false, reason: "invalid" };
  if (picked.some((w) => state.solved.includes(all.get(w)!.difficulty))) return { ok: false, reason: "invalid" };
  if (state.guesses.some((g) => key(g.words) === key(words))) return { ok: false, reason: "repeat" };

  const counts = new Map<Group, number>();
  for (const w of picked) counts.set(all.get(w)!, (counts.get(all.get(w)!) ?? 0) + 1);
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (best[1] === 4) return { ok: true, result: "correct", group: best[0] };
  return { ok: true, result: best[1] === 3 ? "one_away" : "wrong" };
}

/** The state after a valid guess. */
export function apply(state: GameState, words: string[], ev: Extract<Evaluation, { ok: true }>): GameState {
  const guesses = [...state.guesses, { words, result: ev.result, ...(ev.group ? { difficulty: ev.group.difficulty } : {}) }];
  const solved = ev.group ? [...state.solved, ev.group.difficulty] : state.solved;
  const mistakes = state.mistakes + (ev.result === "correct" ? 0 : 1);
  const won = solved.length === 4;
  const finished = won || mistakes >= FORTY_FIVE.maxMistakes;
  return { guesses, mistakes, solved, finished, won, score: finished ? scoreFor(won, mistakes, solved.length) : null };
}

/** Replays a guess log (guests send theirs to get the reveal). Stops at the first invalid guess. */
export function replay(groups: Group[], log: string[][]): GameState {
  let s = emptyState();
  for (const words of log.slice(0, 20)) {
    const ev = evaluate(groups, s, words);
    if (!ev.ok) break;
    s = apply(s, words, ev);
    if (s.finished) break;
  }
  return s;
}

/** Same order for everyone on a given puzzle (players can shuffle locally). */
export function shuffledWords(groups: Group[], seed: string): string[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rand = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)), ((h ^= h >>> 16) >>> 0) / 4294967296);
  const words = groups.flatMap((g) => g.words);
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words;
}

/** Share squares: one row per guess, each square the tier of that word's group. */
export function shareGrid(groups: Group[], guesses: GuessRecord[], squares: Record<number, string>): string {
  const tier = new Map(groups.flatMap((g) => g.words.map((w) => [normWord(w), g.difficulty] as const)));
  return guesses.map((g) => g.words.map((w) => squares[tier.get(normWord(w)) ?? 1]).join("")).join("\n");
}
