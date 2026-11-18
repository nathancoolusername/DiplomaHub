"use server";

import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getAppearancePreference, getDismissedHints, getThemePreference, getViewer, setAppearancePreference, setExamSession, setThemePreference, type ThemePreference } from "@/lib/data";
import { isAccent, isBackdrop, type Appearance } from "@/lib/appearance";
import { pendingAnnouncement, type Announcement } from "@/lib/announcements";
import { access } from "@/lib/plans";
import { sessionIdFromLabel } from "@/lib/exam-sessions";

export type ViewerPrefs = {
  signedIn: boolean;
  isPro: boolean;
  theme: ThemePreference | null;
  /** Saved accent and background; null when nothing is saved (or before migration 48). */
  appearance: Appearance | null;
  /** Show the one-time "Try Midnight" tip: set up, Midnight available to them, not seen yet. */
  midnightTip: boolean;
  /** Show the one-time "Make it yours" accent-colour tip: not seen yet, still on the default accent. */
  styleTip: boolean;
  /** The one-time announcement to show ("Chemistry is here"), if any. */
  news: Announcement | null;
};

/**
 * Plan and saved theme, for client components in the static root layout
 * (the nav's theme picker), which can't read them at render time.
 */
export async function getViewerPrefsAction(): Promise<ViewerPrefs> {
  if (!(await getCurrentUserId())) return { signedIn: false, isPro: false, theme: null, appearance: null, midnightTip: false, styleTip: false, news: null };
  const [viewer, theme, dismissed, saved] = await Promise.all([getViewer(), getThemePreference(), getDismissedHints().catch(() => null), getAppearancePreference().catch(() => null)]);
  const appearance: Appearance | null =
    saved && (saved.accent || saved.backdrop) ? { accent: isAccent(saved.accent) ? saved.accent : "blue", backdrop: isBackdrop(saved.backdrop) ? saved.backdrop : "plain" } : null;
  // Every signed-in student, set up or not (the tips wait while the setup wizard is on screen).
  // If the dismissed list can't be read, show neither rather than risk repeating them.
  const midnightTip = !!dismissed && !dismissed.includes("midnight") && access("midnight_theme", viewer.isPro).allowed && theme !== "midnight";
  const styleTip = !!dismissed && !dismissed.includes("style") && (appearance?.accent ?? "blue") === "blue";
  const news = dismissed ? pendingAnnouncement(dismissed) : null;
  return { signedIn: true, isPro: viewer.isPro, theme, appearance, midnightTip, styleTip, news };
}

/** Saves the theme to the account (Midnight only with Pro; enforced in the database). */
export async function setThemeAction(theme: ThemePreference): Promise<void> {
  if (!(await getCurrentUserId())) return;
  await setThemePreference(theme);
}

/** Saves the accent colour and background (Pro from launch day; enforced in the database). */
export async function setAppearanceAction(a: Appearance): Promise<void> {
  if (!(await getCurrentUserId())) return;
  if (!isAccent(a.accent) || !isBackdrop(a.backdrop)) throw new Error("Unknown style");
  // Before migration 48 the function doesn't exist: the choice stays in this browser only.
  await setAppearancePreference(a.accent, a.backdrop).catch((e: unknown) => {
    if (!String((e as { message?: string })?.message ?? e).includes("set_appearance")) throw e;
  });
}

/** The Hub's session picker ("Nov 2027") saved to the account, where Practice reads it too. */
export async function setExamSessionAction(label: string): Promise<void> {
  if (!(await getCurrentUserId())) return;
  const id = sessionIdFromLabel(label);
  if (id) await setExamSession(id);
}
