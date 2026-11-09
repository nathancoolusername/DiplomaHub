// Forty-Five calendar: one puzzle per UTC day. Migration 34 generates
// number = scheduled_for − LAUNCH_DATE + 1, so keep these in step.

export const LAUNCH_DATE = "2026-11-10";

/** Today's date in UTC, "YYYY-MM-DD". */
export function utcToday(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Next 00:00 UTC, when the next puzzle unlocks. */
export function nextResetAt(now = new Date()): Date {
  return new Date(`${addDays(utcToday(now), 1)}T00:00:00Z`);
}

export function puzzleNumber(date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${LAUNCH_DATE}T00:00:00Z`)) / 86_400_000) + 1;
}

/** 133 → "2:13", 3725 → "1:02:05". */
export function formatTime(seconds: number | null): string {
  if (seconds == null) return "–";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * The puzzle day the server plays. Always today (UTC) in production; in local
 * dev, FORTY_FIVE_TODAY=YYYY-MM-DD (e.g. in .env.development.local) lets you
 * try a scheduled puzzle early. Delete the test play afterwards
 * (scripts/forty-five/delete-test-play.mts).
 */
export function gameDay(): string {
  const o = process.env.NODE_ENV !== "production" ? process.env.FORTY_FIVE_TODAY : undefined;
  return o && /^\d{4}-\d{2}-\d{2}$/.test(o) ? o : utcToday();
}
