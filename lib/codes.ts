// Sharing codes (migration 32): shared rules for the server and the browser.
// No "server-only": the /codes page formats and checks codes as you type.

/** 31 characters: no 0/O and no 1/I/L, so codes survive being read aloud. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export type CodeType = "practice_set" | "pro_trial" | "hub_item" | "hub_set" | "school";

export type RedeemFailReason =
  | "rate_limited"
  | "not_found"
  | "expired"
  | "used_up"
  | "already_redeemed"
  | "own_code"
  | "not_available"
  | "already_unlimited";

export type RedeemResult =
  /** own: the student's own set's code (printed on its PDF): nothing is copied, it opens for marking. */
  | { ok: true; type: "practice_set"; setId: string; title: string; subjectId: string; own?: boolean }
  | { ok: true; type: "hub_item"; hubItemId: string; title: string; startAt: string }
  /** extended: the days start after Pro the student already had. */
  | { ok: true; type: "pro_trial"; days: number; startsAt: string; expiresAt: string; extended: boolean }
  | { ok: true; type: "hub_set"; name: string; count: number; firstStart: string; shiftDays: number }
  /** A Hub set: nothing used yet; ask keep-the-dates or start-on, then redeem again with the choice. */
  | { ok: false; reason: "needs_choice"; preview: HubSetPreview }
  /** The start date picked for a Hub set wasn't usable (nothing was used). */
  | { ok: false; reason: "bad_date"; message: string }
  | { ok: false; reason: RedeemFailReason };

export type HubSetPreview = { name: string; count: number; firstStart: string; lastEnd: string };

/** The redeemer's choice for a Hub set: null keeps the dates; a YYYY-MM-DD moves the first item there. */
export type HubSetChoice = { startOn: string | null; timezone: string };

/** Most items one Hub set can hold. */
export const HUB_SET_MAX_ITEMS = 100;

/** What the student typed → what the database stores: letters and digits, upper case. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Characters a code can never contain (0, O, 1, I, L) — worth a hint while typing. */
export function lookalikes(input: string): string[] {
  return [...new Set(normalizeCode(input).split("").filter((c) => !CODE_ALPHABET.includes(c)))];
}

/** Long codes read in groups of five: ABCDE-FGHJK. Short codes stay as they are. */
export function formatCode(code: string): string {
  const c = normalizeCode(code);
  return c.length > 6 ? (c.match(/.{1,5}/g) ?? [c]).join("-") : c;
}

/** The link that opens /codes with the code filled in. */
export function codeLink(origin: string, code: string): string {
  return `${origin.replace(/\/$/, "")}/codes?c=${encodeURIComponent(normalizeCode(code))}`;
}

export const REDEEM_MESSAGES: Record<RedeemFailReason, { title: string; body: string }> = {
  not_found: { title: "That code doesn't exist", body: "Check it letter by letter. Codes never use 0, O, 1, I or L." },
  expired: { title: "That code has expired", body: "Ask whoever shared it for a new one." },
  used_up: { title: "That code has been used up", body: "Everyone it was meant for has already redeemed it." },
  already_redeemed: { title: "You've already redeemed this code", body: "Whatever it gave you is already on your account." },
  own_code: { title: "That's your own code", body: "Share it with friends: it copies your set or Hub item to their account." },
  rate_limited: { title: "Too many tries", body: "You've entered 10 codes that didn't work in the last hour. Try again later." },
  not_available: { title: "Not available yet", body: "School codes are coming soon." },
  already_unlimited: { title: "You already have unlimited Pro", body: "Keep the code for someone else." },
};

export const CODE_TYPE_INFO: Record<Exclude<CodeType, "school">, { label: string; length: number; body: string }> = {
  practice_set: {
    label: "Practice sets",
    length: 5,
    body: "Share any set from Practice. Friends get their own copy in My sets, with the same questions, timer and settings. Their answers stay theirs.",
  },
  hub_item: {
    label: "Hub items",
    length: 5,
    body: "Share a deadline, test or study session from the Hub. Friends get it on their own Hub as a to-do, with its notes and stages (unticked).",
  },
  hub_set: {
    label: "Hub sets",
    length: 5,
    body: "Share a whole plan, like an exam study schedule: pick the items and name it. Friends keep your dates, or move the plan to start on a day they choose.",
  },
  pro_trial: {
    label: "DiplomaPro trials",
    length: 10,
    body: "Given out by DiplomaHub for beta invites and prizes. Redeeming adds the Pro days after any Pro you already have, so nothing is lost.",
  },
};
