import "server-only";

import type { PracticeStats } from "@/lib/data/types";
import { rpc } from "./client";

/** "Your practice": one bar per day (UTC days for now), oldest first. */
export async function getPracticeStats(days = 14): Promise<PracticeStats> {
  const r = await rpc<{
    days: { date: string; answered: number }[];
    answered: number;
    earned: number;
    possible: number;
    practised_s: number;
  }>("get_practice_stats", { p_days: days, p_tz: "UTC" });
  return {
    days: r.days ?? [],
    answered: r.answered,
    accuracy: r.possible > 0 ? r.earned / r.possible : null,
    practisedS: r.practised_s,
  };
}
