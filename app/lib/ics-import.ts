// Pure .ics import parsing + subject/type suggestion logic — no Next.js or
// Supabase imports, so this stays unit-testable independent of auth/DB
// plumbing (see app/lib/actions/ics-import.ts for the server action that
// wraps this with the user's session, existing-item lookup, and saving).
import ICAL from "ical.js";
import { SUBJECTS, type HubItemType, type SubjectId } from "@/components/hub/mock-data";

export type ParsedImportEvent = {
  // uid + recurrenceId (if any) — the same pair used as `external_uid` when
  // saving, so re-importing the same file naturally updates these rows
  // instead of duplicating them.
  uid: string;
  recurrenceId: string | null;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  isRecurring: boolean;
  suggestedSubjectId: SubjectId | null;
  suggestedType: HubItemType;
};

export type ParseIcsResult =
  | {
      success: true;
      events: ParsedImportEvent[];
      recurringGroupCount: number;
      // True once the 500-event cap was hit — the exact number skipped past
      // that point isn't knowable without a second full pass over
      // (potentially unbounded, e.g. an unbounded RRULE) recurrence
      // expansion, so the UI only needs to know it happened, not by how much.
      truncated: boolean;
      skippedOwnFeedCount: number;
    }
  | { success: false; error: string };

export const MAX_IMPORT_EVENTS = 500;
export const IMPORT_MAX_TITLE_LENGTH = 200;
const WINDOW_PAST_MS = 30 * 24 * 60 * 60 * 1000;
const WINDOW_FUTURE_MONTHS = 18;
// Matches the UID format app/lib/ics.ts generates for our own outbound
// feed — re-importing a file a user got by subscribing to their own Hub
// (then exporting/re-saving it from their calendar app) should be a no-op,
// not a duplicate-everything disaster.
const OWN_FEED_UID_RE = /^item-.+@diplomahub$/;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// One subject's aliases = its real name/shortName from the taxonomy, plus a
// short list of common abbreviations people actually type into calendar
// invites. Deliberately excludes a few spec-suggested aliases that don't
// exist in this app's real 16-subject taxonomy (there's no "Spanish B" —
// this app has never had a Spanish subject) and excludes bare "math"/
// "maths" (ambiguous between AA/AI — guessing wrong is worse than leaving
// it unmatched for the user to pick).
const EXTRA_ALIASES: Partial<Record<SubjectId, string[]>> = {
  math_aa: ["math aa", "maths aa", "aa"],
  math_ai: ["math ai", "maths ai", "ai"],
  physics: ["phys"],
  chemistry: ["chem"],
  biology: ["bio"],
  business: ["bm"],
  economics: ["econ"],
  english: ["eng", "lang and lit", "lang & lit", "language and literature", "language & literature"],
  french: ["french b"],
  history: ["hist"],
  geography: ["geo", "geog"],
  theatre: ["theater", "drama"],
  tok: ["theory of knowledge"],
  ee: ["extended essay"],
};

function aliasesFor(id: SubjectId): string[] {
  const subject = SUBJECTS.find((s) => s.id === id);
  const base = subject ? [subject.name.toLowerCase(), subject.shortName.toLowerCase()] : [];
  return [...new Set([...base, ...(EXTRA_ALIASES[id] ?? [])])];
}

// Checks `candidates` in order and returns the first whose alias appears in
// `title` as a whole word/phrase (never a substring inside a longer word —
// "aa" must not match "baa" or "claim" must not match "ai").
export function suggestSubjectId(title: string, candidates: SubjectId[]): SubjectId | null {
  for (const id of candidates) {
    for (const alias of aliasesFor(id)) {
      if (new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(title)) return id;
    }
  }
  return null;
}

const ASSESSMENT_KEYWORDS = ["deadline", "due", "submission", "ia", "ee", "essay", "exhibition"];

export function suggestItemType(title: string, allDay: boolean, hasSubjectMatch: boolean): HubItemType {
  if (allDay) return "task";
  const looksLikeAssessment = ASSESSMENT_KEYWORDS.some((kw) => new RegExp(`\\b${kw}\\b`, "i").test(title));
  if (looksLikeAssessment && hasSubjectMatch) return "ib_component";
  return "task";
}

export function truncateTitle(title: string, maxLength = IMPORT_MAX_TITLE_LENGTH): string {
  return title.length > maxLength ? title.slice(0, maxLength) : title;
}

// The stable identity used both to look up "does this already exist" during
// preview and as the `external_uid` column value on save — a single-instance
// event's own UID, or uid+recurrenceId for one expanded occurrence of a
// recurring series (so each occurrence updates independently on re-import
// rather than colliding on the shared series UID).
export function buildExternalUid(uid: string, recurrenceId: string | null): string {
  return recurrenceId ? `${uid}::${recurrenceId}` : uid;
}

// ICAL.Time#toJSDate() has a sharp edge: for a "floating" value (no TZID
// and no UTC "Z" — which is exactly what a bare `DTSTART;VALUE=DATE:...`
// all-day event is, since a DATE has no timezone component at all per
// RFC 5545) it builds the JS Date via `new Date(year, month-1, day, ...)`,
// which JS interprets in the *server process's own* local timezone. Same
// import file would then parse to a different calendar day depending on
// what timezone the server happens to run in — verified by testing this
// file locally (non-UTC dev machine) vs. reasoning about Vercel (UTC): the
// former silently shifted every all-day date back by a day. Every other
// case (TZID-qualified or explicit "Z") already goes through
// ICAL.Time#toUnixTime(), which is a real, portable UTC calculation. So
// only the floating case needs a manual, deployment-independent UTC build.
function icalTimeToDate(t: ICAL.Time): Date {
  if (t.zone === ICAL.Timezone.localTimezone) {
    return t.isDate
      ? new Date(Date.UTC(t.year, t.month - 1, t.day))
      : new Date(Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute, t.second));
  }
  return t.toJSDate();
}

// Registers every VTIMEZONE block in the file so later Time→Date
// conversions resolve TZID-qualified DTSTART/DTEND against the file's own
// timezone definitions instead of guessing.
function registerTimezones(root: ICAL.Component): void {
  for (const vtimezone of root.getAllSubcomponents("vtimezone")) {
    try {
      ICAL.TimezoneService.register(vtimezone);
    } catch {
      // A malformed VTIMEZONE shouldn't take down the whole import — any
      // event actually relying on it will just fall back to a floating/UTC
      // interpretation, which is still a usable (if imprecise) result.
    }
  }
}

export function parseIcsFile(
  fileText: string,
  options: { now: Date; userSubjectIds: SubjectId[]; includeRecurring: boolean },
): ParseIcsResult {
  let root: ICAL.Component;
  try {
    const jcal = ICAL.parse(fileText);
    root = new ICAL.Component(jcal);
  } catch {
    return { success: false, error: "That doesn't look like a valid calendar (.ics) file." };
  }

  registerTimezones(root);

  const windowStart = new Date(options.now.getTime() - WINDOW_PAST_MS);
  const windowEnd = new Date(options.now);
  windowEnd.setMonth(windowEnd.getMonth() + WINDOW_FUTURE_MONTHS);

  const veventComponents = root.getAllSubcomponents("vevent");

  // Group raw VEVENT blocks by UID — a recurring series is one "master"
  // block (carries RRULE/RDATE) plus zero or more "override" blocks (share
  // the UID, each carries its own RECURRENCE-ID for one modified instance).
  const groups = new Map<string, ICAL.Component[]>();
  for (const comp of veventComponents) {
    const uid = comp.getFirstPropertyValue("uid") as string | null;
    if (!uid) continue;
    const list = groups.get(uid) ?? [];
    list.push(comp);
    groups.set(uid, list);
  }

  const events: ParsedImportEvent[] = [];
  let recurringGroupCount = 0;
  let skippedOwnFeedCount = 0;
  let capped = false;

  function pushEvent(
    uid: string,
    recurrenceId: string | null,
    title: string,
    start: Date,
    end: Date,
    allDay: boolean,
    isRecurring: boolean,
  ) {
    if (capped) return;
    if (start.getTime() < windowStart.getTime() || start.getTime() > windowEnd.getTime()) return;
    if (events.length >= MAX_IMPORT_EVENTS) {
      capped = true;
      return;
    }
    const suggestedSubjectId = suggestSubjectId(title, options.userSubjectIds);
    events.push({
      uid,
      recurrenceId,
      title: title || "Untitled event",
      start,
      end,
      allDay,
      isRecurring,
      suggestedSubjectId,
      suggestedType: suggestItemType(title, allDay, suggestedSubjectId !== null),
    });
  }

  for (const [uid, group] of groups) {
    if (OWN_FEED_UID_RE.test(uid)) {
      skippedOwnFeedCount++;
      continue;
    }

    const master = group.find((c) => !c.hasProperty("recurrence-id"));
    const overrides = group.filter((c) => c.hasProperty("recurrence-id"));

    if (!master) {
      // Orphan overrides with no master series (malformed/partial export) —
      // treat each as a standalone one-off rather than dropping them.
      for (const comp of overrides) {
        const event = new ICAL.Event(comp);
        const start = icalTimeToDate(event.startDate);
        const end = icalTimeToDate(event.endDate);
        pushEvent(uid, event.recurrenceId?.toString() ?? null, event.summary, start, end, event.startDate.isDate, false);
      }
      continue;
    }

    const masterEvent = new ICAL.Event(master, {
      exceptions: overrides.map((c) => new ICAL.Event(c)),
    });

    if (!masterEvent.isRecurring()) {
      const start = icalTimeToDate(masterEvent.startDate);
      const end = icalTimeToDate(masterEvent.endDate);
      pushEvent(uid, null, masterEvent.summary, start, end, masterEvent.startDate.isDate, false);
      continue;
    }

    recurringGroupCount++;
    if (!options.includeRecurring) continue;

    const iterator = masterEvent.iterator();
    const allDay = masterEvent.startDate.isDate;
    // Safety valve independent of the overall 500 cap — a pathological
    // RRULE (e.g. a daily event with no UNTIL/COUNT) must not spin forever;
    // 2000 occurrences is far more than any date window below could ever
    // need before the cap or the window bound kicks in.
    let guard = 0;
    let next: ICAL.Time | null;
    while (!capped && guard++ < 2000 && (next = iterator.next())) {
      if (next.toJSDate().getTime() > windowEnd.getTime()) break;
      const details = masterEvent.getOccurrenceDetails(next);
      const start = icalTimeToDate(details.startDate);
      const end = icalTimeToDate(details.endDate);
      pushEvent(uid, details.recurrenceId.toString(), details.item.summary, start, end, allDay, true);
    }
  }

  return {
    success: true,
    events: events.sort((a, b) => a.start.getTime() - b.start.getTime()),
    recurringGroupCount,
    truncated: capped,
    skippedOwnFeedCount,
  };
}
