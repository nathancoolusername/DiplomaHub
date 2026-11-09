// The order "Schedule" puts approved daily puzzles on the calendar. Pure.

export const SCHEDULE = {
  /** Always first (launch day). */
  opener: "d-001",
  /** Mixed-final puzzles from this slug on jump the queue (the newest batch). */
  priorityFrom: "d-091",
  /** How many puzzles with a Mixed final group per one without (4 → 80%). */
  mixedPerOther: 4,
} as const;

export type Schedulable = { slug: string; mixedFinal: boolean };

export function scheduleOrder<T extends Schedulable>(items: T[]): T[] {
  const rank = (p: T) => (p.slug === SCHEDULE.opener ? 0 : p.slug >= SCHEDULE.priorityFrom ? 1 : 2);
  const mixed = items.filter((p) => p.mixedFinal).sort((a, b) => rank(a) - rank(b) || a.slug.localeCompare(b.slug));
  const other = items.filter((p) => !p.mixedFinal).sort((a, b) => (a.slug === SCHEDULE.opener ? -1 : b.slug === SCHEDULE.opener ? 1 : a.slug.localeCompare(b.slug)));
  if (other[0]?.slug === SCHEDULE.opener) return [other.shift()!, ...interleave(mixed, other)];
  return interleave(mixed, other);
}

function interleave<T>(mixed: T[], other: T[]): T[] {
  const out: T[] = [];
  let m = 0;
  let o = 0;
  while (m < mixed.length || o < other.length) {
    for (let i = 0; i < SCHEDULE.mixedPerOther && m < mixed.length; i++) out.push(mixed[m++]);
    if (o < other.length) out.push(other[o++]);
  }
  return out;
}

export const hasMixedFinal = (groups: { difficulty: number; subject: string }[]) => groups.some((g) => g.difficulty === 4 && g.subject === "Mixed");
