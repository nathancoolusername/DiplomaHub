import type { HubItem } from "./mock-data";
import { formatDayTime, formatTime, isSameDay } from "./calendar/calendar-utils";

export type DueStatus = "done" | "overdue" | "due-today" | "upcoming";

export function getDueStatus(item: HubItem, now: Date): DueStatus {
  if (item.status === "done") return "done";
  const ref = item.end;
  if (ref.getTime() < now.getTime() && !isSameDay(ref, now)) return "overdue";
  if (isSameDay(ref, now)) return ref.getTime() < now.getTime() && !item.allDay ? "overdue" : "due-today";
  return "upcoming";
}

export function formatDueLabel(item: HubItem, now: Date): string {
  const status = getDueStatus(item, now);
  const ref = item.end;

  if (status === "done") return "Completed";
  if (status === "overdue") return `Overdue — was due ${formatDayTime(ref)}`;
  if (status === "due-today") {
    if (item.allDay) return "Due today";
    const diffMs = ref.getTime() - now.getTime();
    const diffHrs = Math.max(0, Math.round(diffMs / 3600000));
    return diffHrs <= 0
      ? `Due today, ${formatTime(ref)}`
      : `Due today, ${formatTime(ref)} (in ${diffHrs} hr${diffHrs === 1 ? "" : "s"})`;
  }
  return `Due ${formatDayTime(ref)}`;
}

// The graduating exam session shown in the Hub header. Guests get the same
// generic default as anyone whose profile doesn't say otherwise (Pre-IB,
// Alumni, Educator, or no ib_year set at all) — only a signed-in DP1/DP2
// student's own year picks a different one. Editable afterward via
// SessionPicker; this is only ever the *starting* value.
export function defaultHubSession(isGuest: boolean, ibYear: string | null): string {
  if (!isGuest) {
    if (ibYear === "DP2") return "May 2027";
    if (ibYear === "DP1") return "May 2028";
  }
  return "May 2027";
}

export function relativeDayLabel(date: Date, now: Date): string {
  const startOfNow = new Date(now);
  startOfNow.setHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfDate.getTime() - startOfNow.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 1) return `In ${diffDays} days`;
  if (diffDays === -1) return "Yesterday";
  return `${Math.abs(diffDays)} days ago`;
}
