// Forty-Five personal stats from a student's counted daily games. Pure.

import { FORTY_FIVE } from "./config.ts";
import { addDays } from "./dates.ts";
import type { MyStats } from "./types.ts";

/** Pure, exported for tests. A streak day is a win (or any finished game if streakCountsLosses). */
export function statsFrom(games: { date: string; score: number; won: boolean }[], today: string): MyStats {
  const counts = (g: { won: boolean }) => g.won || FORTY_FIVE.streakCountsLosses;
  let maxStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const g of games) {
    if (!counts(g)) run = 0;
    else run = prev && addDays(prev, 1) === g.date && run > 0 ? run + 1 : 1;
    if (counts(g)) prev = g.date;
    maxStreak = Math.max(maxStreak, run);
  }
  // Current streak: counted days ending today, or yesterday if today isn't played yet.
  const byDate = new Map(games.map((g) => [g.date, g]));
  let day = byDate.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (byDate.get(day) && counts(byDate.get(day)!)) {
    streak++;
    day = addDays(day, -1);
  }
  const dist = new Map<number, number>();
  for (const g of games) dist.set(g.score, (dist.get(g.score) ?? 0) + 1);
  const total = games.reduce((a, g) => a + g.score, 0);
  return {
    played: games.length,
    wins: games.filter((g) => g.won).length,
    streak,
    maxStreak,
    average: games.length ? Math.round((total / games.length) * 10) / 10 : null,
    distribution: [...dist.entries()].sort((a, b) => b[0] - a[0]).map(([score, count]) => ({ score, count })),
  };
}

