// The Hub labels exam sessions "May 2027" / "Nov 2027"; the database ids are
// "may-2027" / "nov-2027". Safe for client and server.

const MONTHS: Record<string, string> = { may: "may", nov: "nov", november: "nov" };

/** "Nov 2027" → "nov-2027", or null for anything that isn't a session label. */
export function sessionIdFromLabel(label: string | null | undefined): string | null {
  const m = /^\s*([A-Za-z]+)\.?\s+(\d{4})\s*$/.exec(label ?? "");
  const month = m && MONTHS[m[1].toLowerCase()];
  return m && month ? `${month}-${m[2]}` : null;
}

/** "nov-2027" → "Nov 2027", or null for an unknown id. */
export function sessionLabelFromId(id: string | null | undefined): string | null {
  const m = /^(may|nov)-(\d{4})$/.exec(id ?? "");
  return m ? `${m[1] === "may" ? "May" : "Nov"} ${m[2]}` : null;
}

/** localStorage key of the session a student picked in the Hub before it was saved to their account (per user). */
export const HUB_SESSION_OVERRIDE_KEY_PREFIX = "hub_session_override:";
