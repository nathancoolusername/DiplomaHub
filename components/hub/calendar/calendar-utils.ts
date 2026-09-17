export const START_HOUR = 7;
export const END_HOUR = 22;
export const PX_PER_HOUR = 56;
export const PX_PER_MIN = PX_PER_HOUR / 60;
export const CALENDAR_BODY_HEIGHT = (END_HOUR - START_HOUR) * PX_PER_HOUR;
export const TIME_COL_WIDTH = 56;
// Shared by the sticky day-header row and the hour body so their columns
// can never drift apart.
export const GRID_COLS = `${TIME_COL_WIDTH}px repeat(7, minmax(0, 1fr))`;

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60000);
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getWeekStart(anchor: Date): Date {
  const d = startOfDay(anchor);
  const diff = (d.getDay() + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  return d;
}

export function getWeekDates(anchor: Date): Date[] {
  const start = getWeekStart(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function getDayIndexInWeek(date: Date, weekDates: Date[]): number {
  return weekDates.findIndex((d) => isSameDay(d, date));
}

export function timeToY(d: Date): number {
  const hours = d.getHours() + d.getMinutes() / 60;
  return (hours - START_HOUR) * PX_PER_HOUR;
}

export function durationMinutes(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 60000;
}

export function durationToHeight(start: Date, end: Date): number {
  return Math.max(18, durationMinutes(start, end) * PX_PER_MIN);
}

export function snapTo15(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

// Slides a start/end pair (preserving duration) so it fits within the
// visible 07:00-22:00 window for whatever day `start` falls on.
export function clampToVisibleRange(start: Date, end: Date): { start: Date; end: Date } {
  const durationMs = end.getTime() - start.getTime();
  const dayStart = startOfDay(start);
  const rangeStart = addMinutes(dayStart, START_HOUR * 60);
  const rangeEnd = addMinutes(dayStart, END_HOUR * 60);

  let s = start;
  let e = end;
  if (s.getTime() < rangeStart.getTime()) {
    s = rangeStart;
    e = new Date(s.getTime() + durationMs);
  }
  if (e.getTime() > rangeEnd.getTime()) {
    e = rangeEnd;
    s = new Date(e.getTime() - durationMs);
  }
  if (s.getTime() < rangeStart.getTime()) s = rangeStart;
  return { start: s, end: e };
}

export type LayoutedItem<T> = { item: T; column: number; columns: number };

// Cluster-and-greedy-column layout for same-day overlapping items: items are
// swept in start order, grouped into clusters of mutually-touching time
// ranges, and within each cluster assigned the lowest-numbered column whose
// previous occupant has already ended.
export function layoutOverlappingItems<T extends { start: Date; end: Date }>(
  items: T[],
): LayoutedItem<T>[] {
  const sorted = [...items].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime(),
  );

  const result: LayoutedItem<T>[] = [];
  let clusterItems: { item: T; col: number }[] = [];
  let clusterMaxEnd = -Infinity;
  let colEnds: number[] = [];

  function flushCluster() {
    if (!clusterItems.length) return;
    const columns = Math.max(...clusterItems.map((c) => c.col)) + 1;
    for (const c of clusterItems) result.push({ item: c.item, column: c.col, columns });
    clusterItems = [];
    colEnds = [];
  }

  for (const item of sorted) {
    if (clusterItems.length && item.start.getTime() >= clusterMaxEnd) {
      flushCluster();
      clusterMaxEnd = -Infinity;
    }
    let col = colEnds.findIndex((end) => end <= item.start.getTime());
    if (col === -1) {
      col = colEnds.length;
      colEnds.push(item.end.getTime());
    } else {
      colEnds[col] = item.end.getTime();
    }
    clusterItems.push({ item, col });
    clusterMaxEnd = Math.max(clusterMaxEnd, item.end.getTime());
  }
  flushCluster();

  return result;
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDayTime(d: Date): string {
  return `${d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}, ${formatTime(d)}`;
}

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toTimeInputValue(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
