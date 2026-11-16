// Overall IB subject grade boundaries, used to estimate a 1–7 grade from a
// percentage (Progress page, Bro). Lower bounds for grades 2–7, in %: a
// score at or above a bound gets that grade.
//
// SOURCE: the IB's "MAY 2025 Grade boundaries for Diploma programme
// coordinators" (FINAL / overall subject boundaries), from Nathan's copy on
// 2026-11-14. Each value is the average of that subject and level's time
// zones (the comment lists which), rounded, since most students don't know
// theirs. A student can replace a subject's boundaries with their school's
// (student_boundaries, migration 42); those win.
// Update this table when a newer session's document comes out.

export type Level = "HL" | "SL";

/** Lower bounds (%) for grades 2, 3, 4, 5, 6, 7. */
export type Bounds = [number, number, number, number, number, number];

export type Boundaries = { bounds: Bounds; source: string; custom?: boolean };

const IB = "IB May 2025";
const b = (bounds: Bounds): Boundaries => ({ bounds, source: IB });

const TABLE: Record<string, Partial<Record<Level, Boundaries>>> = {
  english_a_lit: { SL: b([12, 24, 36, 49, 62, 75]), HL: b([14, 28, 39, 52, 64, 78]) }, // ENGLISH A LIT; SL TZ 1,2,3/HL TZ 1,2,3
  english_a_langlit: { SL: b([11, 23, 36, 51, 64, 78]), HL: b([13, 25, 40, 53, 65, 78]) }, // ENGLISH A LAL; SL TZ 1,2,3/HL TZ 1,2,3
  english_b: { SL: b([11, 24, 38, 54, 71, 87]), HL: b([12, 26, 43, 59, 74, 90]) }, // ENGLISH B; SL TZ 1,2,3/HL TZ 1,2,3
  french_a_lit: { SL: b([14, 28, 41, 56, 71, 86]), HL: b([16, 30, 42, 56, 70, 84]) }, // FRENCH A LIT; SL TZ 2/HL TZ 2,3
  french_a_langlit: { SL: b([14, 27, 39, 52, 67, 80]), HL: b([14, 28, 40, 54, 68, 80]) }, // FRENCH A LAL; SL TZ 2,3/HL TZ 2,3
  french_b: { SL: b([10, 22, 35, 50, 67, 81]), HL: b([15, 29, 46, 59, 71, 84]) }, // FRENCH B; SL TZ 1,2,3/HL TZ 1,2,3
  german_a_lit: { SL: b([15, 32, 44, 55, 70, 81]), HL: b([16, 30, 43, 56, 69, 82]) }, // GERMAN A LIT; SL TZ 0/HL TZ 0
  german_a_langlit: { SL: b([12, 25, 33, 48, 65, 79]), HL: b([15, 29, 40, 54, 68, 82]) }, // GERMAN A LAL; SL TZ 0/HL TZ 0
  german_b: { SL: b([10, 20, 34, 49, 66, 80]), HL: b([12, 22, 40, 56, 72, 88]) }, // GERMAN B; SL TZ 2,3/HL TZ 2,3
  spanish_a_lit: { SL: b([12, 26, 40, 53, 68, 81]), HL: b([14, 28, 40, 54, 67, 80]) }, // SPANISH A LIT; SL TZ 2,3/HL TZ 2,3
  spanish_a_langlit: { SL: b([12, 24, 38, 52, 67, 82]), HL: b([12, 26, 40, 54, 66, 80]) }, // SPANISH A LAL; SL TZ 2,3/HL TZ 2,3
  spanish_b: { SL: b([9, 19, 33, 49, 67, 82]), HL: b([13, 26, 38, 54, 70, 86]) }, // SPANISH B; SL TZ 1,2,3/HL TZ 1,2,3
  math_aa: { SL: b([8, 17, 28, 42, 55, 69]), HL: b([12, 24, 35, 48, 61, 73]) }, // MATH ANALYSIS; SL TZ 1,2,3/HL TZ 1,2,3
  physics: { SL: b([12, 20, 32, 43, 53, 64]), HL: b([14, 24, 35, 46, 58, 69]) }, // PHYSICS; SL TZ 1,2,3/HL TZ 1,2,3
  chemistry: { SL: b([15, 27, 37, 48, 60, 71]), HL: b([15, 26, 40, 52, 63, 74]) }, // CHEMISTRY; SL TZ 1,2,3/HL TZ 1,2,3
  economics: { SL: b([14, 28, 41, 52, 64, 76]), HL: b([14, 28, 40, 52, 64, 77]) }, // ECONOMICS; SL TZ 1,2,3/HL TZ 1,2,3
  math_ai: { SL: b([10, 20, 30, 44, 57, 71]), HL: b([12, 24, 34, 47, 59, 70]) }, // MATH APPS; SL TZ 1,2,3/HL TZ 1,2,3
  history: { SL: b([12, 26, 36, 49, 63, 77]), HL: b([11, 25, 36, 49, 61, 74]) }, // HISTORY; SL TZ 1,2,3/HL TZ 1,2,3
  geography: { SL: b([13, 27, 41, 53, 66, 78]), HL: b([14, 30, 43, 53, 64, 75]) }, // GEOGRAPHY; SL TZ 1,2,3/HL TZ 1,2,3
  cs: { SL: b([14, 29, 44, 53, 63, 72]), HL: b([16, 32, 44, 54, 64, 74]) }, // COMPUTER SC.; SL TZ 2,3/HL TZ 2,3
  biology: { SL: b([12, 24, 36, 49, 61, 74]), HL: b([13, 24, 36, 49, 62, 75]) }, // BIOLOGY; SL TZ 1,2,3/HL TZ 1,2,3
  business: { SL: b([14, 28, 39, 51, 64, 76]), HL: b([13, 25, 37, 49, 61, 73]) }, // BUS MAN; SL TZ 1,2,3/HL TZ 1,2,3
  psychology: { SL: b([12, 25, 36, 50, 60, 73]), HL: b([10, 22, 35, 47, 60, 72]) }, // PSYCHOLOGY; SL TZ 1,2,3/HL TZ 1,2,3
  philosophy: { SL: b([14, 29, 43, 55, 67, 79]), HL: b([15, 30, 42, 54, 67, 78]) }, // PHILOSOPHY; SL TZ 2,3/HL TZ 2,3
  ess: { SL: b([12, 23, 35, 45, 56, 67]) }, // ENV. AND SOC.; SL TZ 1,2,3
  sport_science: { SL: b([13, 25, 36, 47, 60, 71]), HL: b([13, 22, 34, 45, 57, 69]) }, // SPORTS EX SCI; SL TZ 1,2,3/HL TZ 1,2,3
  theatre: { SL: b([10, 20, 36, 52, 70, 86]), HL: b([10, 21, 37, 52, 69, 84]) }, // THEATRE; SL TZ 0/HL TZ 0
};

/** For subjects not in the table (custom subjects): roughly the median of the table. */
export const GENERIC: Boundaries = { bounds: [13, 26, 38, 51, 64, 77], source: "typical IB boundaries" };

/**
 * A subject's boundaries: the student's own (their school's) when set,
 * otherwise the IB's at their level (SL when unknown, or whichever level exists).
 */
export function boundariesFor(subjectId: string, level: Level | null | undefined, custom?: Bounds | null): Boundaries {
  if (custom) return { bounds: custom, source: "your school", custom: true };
  const row = TABLE[subjectId];
  return row?.[level ?? "SL"] ?? row?.SL ?? row?.HL ?? GENERIC;
}

/** The IB default, ignoring any custom boundaries (for "Reset"). */
export function defaultBoundaries(subjectId: string, level: Level | null | undefined): Boundaries {
  return boundariesFor(subjectId, level, null);
}

/** Valid custom bounds: six whole numbers from 1 to 100, each higher than the last. */
export function checkBounds(v: unknown): Bounds | null {
  if (!Array.isArray(v) || v.length !== 6) return null;
  const n = v.map((x) => Number(x));
  if (n.some((x) => !Number.isInteger(x) || x < 1 || x > 100)) return null;
  for (let i = 1; i < 6; i++) if (n[i] <= n[i - 1]) return null;
  return n as Bounds;
}

/** The 1–7 grade a percentage would get under these boundaries. */
export function gradeFromPercent(percent: number, b: Boundaries): number {
  let grade = 1;
  b.bounds.forEach((lower, i) => {
    if (percent >= lower) grade = i + 2;
  });
  return grade;
}
