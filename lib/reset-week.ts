// The Sunday Reset's week, worked out in the student's own time zone (so on
// the client). Saturday, Sunday and Monday are "reset days": on Saturday and
// Sunday you plan the coming week, on Monday the week that just started.

const pad = (n: number) => String(n).padStart(2, "0");
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The Monday (YYYY-MM-DD) of the week being planned. */
export function resetWeekStart(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = d.getDay(); // 0 Sunday … 6 Saturday
  const toMonday = dow === 6 ? 2 : dow === 0 ? 1 : 1 - dow;
  d.setDate(d.getDate() + toMonday);
  return dayKey(d);
}

/** Saturday, Sunday or Monday. */
export function isResetDay(now = new Date()): boolean {
  return [6, 0, 1].includes(now.getDay());
}
