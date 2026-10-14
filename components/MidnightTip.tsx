"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sparkles, X } from "lucide-react";
import { setThemeAction } from "@/app/actions/viewer";
import { useHintTurn } from "./shared/FirstTimeHint";
import { switchTheme } from "./shared/theme-transition";
import { useViewerPrefs } from "./shared/use-is-pro";
import { useOnboardingOpen } from "./shared/onboarding-open";

/**
 * The one-time "Try Midnight" tip under the nav's theme picker (on phones,
 * under the menu button, where the picker lives). Every signed-in student
 * gets it once, on the first page they open (it waits while the setup wizard
 * is open); it's saved to
 * their account, so it never comes back on another device. It waits its turn
 * behind the other first-time tips, and goes away by itself if they pick
 * Midnight some other way.
 */
// Also kept in this browser, so the tip can't come back on every page if
// saving to the account fails (e.g. before migration 22 has run).
const SEEN_KEY = "dp-midnight-tip-seen";
const noop = () => () => {};
function readSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function MidnightTip() {
  const prefs = useViewerPrefs();
  const { theme, setTheme } = useTheme();
  const wizardOpen = useOnboardingOpen();
  const seenHere = useSyncExternalStore(noop, readSeen, () => true);
  const { show, dismiss: dismissTurn } = useHintTurn("midnight", prefs?.midnightTip === true && !wizardOpen && !seenHere);
  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // the account still remembers it
    }
    dismissTurn();
  }, [dismissTurn]);
  const [switching, setSwitching] = useState(false);

  // Already on Midnight (picked from the theme picker or the Home card): nothing to suggest.
  useEffect(() => {
    if (show && theme === "midnight" && !switching) dismiss();
  }, [show, theme, switching, dismiss]);

  if (!show) return null;

  const tryIt = () => {
    setSwitching(true);
    void switchTheme(setTheme, "midnight").then(() => setSwitching(false));
    void setThemeAction("midnight").catch(() => {});
    dismiss();
  };

  return (
    <div
      role="dialog"
      aria-labelledby="midnight-tip-title"
      className="absolute right-0 top-full mt-sm z-50 w-72 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl p-md flex flex-col gap-sm"
    >
      <span aria-hidden="true" className="absolute -top-1.5 right-6 w-3 h-3 rotate-45 bg-inverse-surface" />
      <div className="flex items-start justify-between gap-sm">
        <p id="midnight-tip-title" className="font-semibold flex items-center gap-xs">
          <Sparkles size={16} aria-hidden="true" /> Try the Midnight theme
        </p>
        <button type="button" onClick={dismiss} aria-label="Not now" className="p-0.5 opacity-80 hover:opacity-100 cursor-pointer">
          <X size={16} />
        </button>
      </div>
      <p className="text-label-md opacity-90">
        Deep navy, frosted cards and ice-blue accents. Free for now. You can switch back any time from the theme picker
        <span className="md:hidden"> in the menu</span>.
      </p>
      <div className="flex justify-end gap-xs">
        <button type="button" onClick={dismiss} className="rounded-lg px-md py-xs text-label-md font-semibold opacity-90 hover:opacity-100 cursor-pointer">
          Not now
        </button>
        <button
          type="button"
          onClick={tryIt}
          className="rounded-lg bg-inverse-on-surface/15 px-md py-xs text-label-md font-semibold hover:bg-inverse-on-surface/25 cursor-pointer"
        >
          Try Midnight
        </button>
      </div>
    </div>
  );
}
