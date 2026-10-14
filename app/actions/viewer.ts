"use server";

import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getThemePreference, getViewer, hasDismissedHint, setExamSession, setThemePreference, type ThemePreference } from "@/lib/data";
import { access } from "@/lib/plans";
import { sessionIdFromLabel } from "@/lib/exam-sessions";

export type ViewerPrefs = {
  signedIn: boolean;
  isPro: boolean;
  theme: ThemePreference | null;
  /** Show the one-time "Try Midnight" tip: set up, Midnight available to them, not seen yet. */
  midnightTip: boolean;
};

/**
 * Plan and saved theme, for client components in the static root layout
 * (the nav's theme picker), which can't read them at render time.
 */
export async function getViewerPrefsAction(): Promise<ViewerPrefs> {
  if (!(await getCurrentUserId())) return { signedIn: false, isPro: false, theme: null, midnightTip: false };
  const [viewer, theme, seen] = await Promise.all([getViewer(), getThemePreference(), hasDismissedHint("midnight").catch(() => true)]);
  // Every signed-in student, set up or not (the tip waits while the setup wizard is on screen).
  const midnightTip = !seen && access("midnight_theme", viewer.isPro).allowed && theme !== "midnight";
  return { signedIn: true, isPro: viewer.isPro, theme, midnightTip };
}

/** Saves the theme to the account (Midnight only with Pro; enforced in the database). */
export async function setThemeAction(theme: ThemePreference): Promise<void> {
  if (!(await getCurrentUserId())) return;
  await setThemePreference(theme);
}

/** The Hub's session picker ("Nov 2027") saved to the account, where Practice reads it too. */
export async function setExamSessionAction(label: string): Promise<void> {
  if (!(await getCurrentUserId())) return;
  const id = sessionIdFromLabel(label);
  if (id) await setExamSession(id);
}
