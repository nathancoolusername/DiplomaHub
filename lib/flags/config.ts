// Flags rules: change the numbers here and nowhere else. The caps are also in
// the migration's leaderboard views (supabase/migrations/…_flags.sql).

export type Mode = "daily" | "all" | "hard";
/** The replayable modes, each with its own best-run board. */
export type FreeMode = Exclude<Mode, "daily">;

export const FLAGS = {
  /** Daily sprint #1. The number is days since this + 1. */
  launchDate: "2026-11-24",
  /** Flags in the sprint by tier: 7 easy, 8 medium, 5 hard. */
  dailyMix: { 1: 7, 2: 8, 3: 5 } as const,
  /** Time caps, seconds. The run ends by itself when the cap is reached. */
  capSeconds: { daily: 300, all: 900, hard: 1200 } as Record<Mode, number>,
  /** Late answers accepted after the cap (network, slow tabs), ms. */
  graceMs: 5_000,
  /** Wait before accepting a name that's the start of another one ("Niger"…"ia"), ms. */
  prefixWaitMs: 700,
  /** Runs faster than this per flag (with at least `minFlagsForPace` named) don't make the board. */
  minMsPerFlag: 600,
  minFlagsForPace: 10,
  /** Three answers inside this window don't make the board either (nobody types three names that fast). */
  burstWindowMs: 900,
} as const;
