// Pure ICS (RFC 5545) generation for the Hub calendar feed — no Next.js or
// Supabase imports here on purpose, so this stays trivially unit-testable
// once the project has a test runner (see app/api/calendar/[token]/route.ts
// for the only caller, which does the auth/DB/Next-specific plumbing).
import ical from "ical-generator";
import type { HubItemStatus, HubItemType } from "@/components/hub/mock-data";

export type IcsFeedItem = {
  id: string;
  title: string;
  type: HubItemType;
  subjectShortName: string | null;
  start: Date;
  end: Date;
  allDay: boolean;
  status: HubItemStatus;
};

// RFC 5545 all-day events take an *exclusive* DTEND — a single-day event
// spanning just "20 Sept" needs DTEND=21 Sept, or calendar apps render it
// as covering two days. ical-generator does not add this day itself (it
// formats whatever Date it's given), so this always adds exactly one day
// to the UTC calendar date of `end` — the day after the last inclusive day
// the item spans, regardless of whether `end`'s date is the same as
// `start`'s (the common single-day case) or later (a genuine multi-day
// item). UTC, not local/server time, since hub_items stores timestamptz
// and this must read the same calendar day the DB actually holds
// regardless of what timezone the server process happens to run in.
export function toExclusiveAllDayEnd(end: Date): Date {
  return new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() + 1));
}

// "<subject short name> · <title>", prefixed with "✓ " once done. No
// subject (e.g. a University Deadline) just falls back to the plain title.
export function buildEventSummary(item: Pick<IcsFeedItem, "title" | "subjectShortName" | "status">): string {
  const base = item.subjectShortName ? `${item.subjectShortName} · ${item.title}` : item.title;
  return item.status === "done" ? `✓ ${base}` : base;
}

export function generateHubIcs(items: IcsFeedItem[]): string {
  const calendar = ical({
    name: "DiplomaHub",
    prodId: { company: "DiplomaHub", product: "Hub", language: "EN" },
  });

  const now = new Date();
  for (const item of items) {
    calendar.createEvent({
      id: `item-${item.id}@diplomahub`,
      stamp: now,
      allDay: item.allDay,
      start: item.start,
      end: item.allDay ? toExclusiveAllDayEnd(item.end) : item.end,
      summary: buildEventSummary(item),
      // Deliberately no `.timezone(...)` set — leaving it unset makes
      // ical-generator format every date in UTC (a bare "Z" datetime for
      // timed events, and the UTC calendar date for all-day ones), which
      // is both what the spec asks for and what avoids ever needing a
      // VTIMEZONE block.
    });
  }

  return calendar.toString();
}
