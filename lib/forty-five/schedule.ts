// The order "Schedule" puts approved daily puzzles on the calendar. Pure.

import { LAUNCH_DATE, addDays } from "./dates.ts";

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

/**
 * Calendar days with no puzzle, from launch day to the last scheduled day
 * (or today, if later and today is empty). Dates are "YYYY-MM-DD", UTC. Pure.
 */
export function calendarGaps(scheduled: string[], today: string, launch = LAUNCH_DATE): string[] {
  const taken = new Set(scheduled);
  const last = [...scheduled, today].sort().at(-1)!;
  const out: string[] = [];
  for (let d = launch; d <= last; d = addDays(d, 1)) if (!taken.has(d)) out.push(d);
  return out;
}

export type Placement = { id: string; from: string | null; to: string };

/**
 * Plans the calendar from `from` (today, or launch day) on so no day is left
 * empty. Walks the days in order: a day that already has a puzzle keeps it; an
 * empty day takes the next puzzle from `queue` (approved, unscheduled, already
 * in scheduleOrder) or, when the queue is empty, the next scheduled puzzle
 * moves up into it (so every later puzzle moves up one day per gap). Leftover
 * queue puzzles go on the days after the last one, as before.
 *
 * Days before `from` are never touched: those puzzles have been played.
 * Returns only the changes, in an order that is safe to apply one by one
 * under the one-puzzle-per-day unique constraint (each target day is free by
 * the time its update runs). Pure.
 */
export function planCalendar(scheduled: { id: string; date: string }[], queue: { id: string }[], from: string): Placement[] {
  const later = scheduled.filter((p) => p.date >= from).sort((a, b) => a.date.localeCompare(b.date));
  const q = [...queue];
  const out: Placement[] = [];
  let i = 0;
  for (let d = from; i < later.length || q.length; d = addDays(d, 1)) {
    const next = later[i];
    if (next && next.date === d) {
      i++;
    } else if (q.length) {
      out.push({ id: q.shift()!.id, from: null, to: d });
    } else {
      out.push({ id: next.id, from: next.date, to: d });
      i++;
    }
  }
  return out;
}
