export const TIMER_DURATION_MS = 25 * 60 * 1000;
// Classic Pomodoro cadence: 4 focus sessions per cycle before the count
// wraps back to 1 (a long break would normally follow session 4).
export const SESSIONS_PER_CYCLE = 4;

export type TimerStatus = "idle" | "running" | "paused" | "complete";

export type TimerState = {
  status: TimerStatus;
  // Timestamp (Date.now()) the current running interval began, or null when
  // not running. Remaining time is always derived from this rather than
  // decremented on a tick, so a throttled/backgrounded tab can't drift.
  startedAt: number | null;
  // Milliseconds remaining as of `startedAt` (or as of the last pause).
  anchorRemainingMs: number;
  taskId: string | null;
};

export const INITIAL_TIMER_STATE: TimerState = {
  status: "idle",
  startedAt: null,
  anchorRemainingMs: TIMER_DURATION_MS,
  taskId: null,
};

export function getRemainingMs(state: TimerState, now: number): number {
  if (state.status === "running" && state.startedAt !== null) {
    return Math.max(0, state.anchorRemainingMs - (now - state.startedAt));
  }
  return state.anchorRemainingMs;
}

export function formatTimer(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
