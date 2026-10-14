// Strength score rules from the build spec. Pure functions, shared by the
// mock layer now and the finish-attempt RPC/route later.

import type { StrengthLevel } from "@/lib/data/types";

/** How far each finished question moves a subtopic score towards its result. */
export const STRENGTH_RATE = 0.3;

/** Below this many answered questions a subtopic shows "Not enough data". */
export const MIN_ANSWERED = 5;

// Starting thresholds, to tune with real data.
const THRESHOLDS: [number, StrengthLevel][] = [
  [0.4, "weak"],
  [0.55, "developing"],
  [0.7, "solid"],
  [0.85, "strong"],
];

export const STRENGTH_LEVELS: StrengthLevel[] = ["none", "weak", "developing", "solid", "strong", "mastered"];

export const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  none: "Not enough data",
  weak: "Weak",
  developing: "Developing",
  solid: "Solid",
  strong: "Strong",
  mastered: "Mastered",
};

export function levelFor(score: number | null, answeredCount: number): StrengthLevel {
  if (score === null || answeredCount < MIN_ANSWERED) return "none";
  for (const [limit, level] of THRESHOLDS) if (score < limit) return level;
  return "mastered";
}

/**
 * score_new = score_old + 0.3 × (earned / possible − score_old).
 * The first answer in a subtopic sets the score outright.
 */
export function nudgeScore(old: number | null, earned: number, possible: number): number {
  const result = possible > 0 ? earned / possible : 0;
  if (old === null) return result;
  return old + STRENGTH_RATE * (result - old);
}

export function averageScore(scores: (number | null)[]): number | null {
  const known = scores.filter((s): s is number => s !== null);
  if (known.length === 0) return null;
  return known.reduce((a, b) => a + b, 0) / known.length;
}
