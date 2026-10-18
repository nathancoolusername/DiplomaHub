// One-time announcements, shown once per account as a small card in the
// corner (components/NewsToast.tsx). Ids must look like "news-xxx": the
// database accepts any such id (migration 24), so adding one needs no SQL.
// Newest first; a student sees at most one at a time, and none after `until`
// (so someone who signs up months later isn't told old news).

export type Announcement = {
  id: `news-${string}`;
  title: string;
  body: string;
  /** Where the button goes. */
  href: string;
  cta: string;
  /** Last day it shows (YYYY-MM-DD, inclusive). */
  until: string;
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "news-chemistry",
    title: "Chemistry is here",
    body: "Chemistry questions are now in Practice, for Paper 1A, Paper 1B and Paper 2, SL and HL.",
    href: "/practice/chemistry",
    cta: "Try Chemistry",
    until: "2026-12-31",
  },
];

/** The newest announcement this student hasn't dismissed and that hasn't expired. */
export function pendingAnnouncement(dismissed: readonly string[], today = new Date().toISOString().slice(0, 10)): Announcement | null {
  return ANNOUNCEMENTS.find((a) => a.until >= today && !dismissed.includes(a.id)) ?? null;
}
