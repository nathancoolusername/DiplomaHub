"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { setThemeAction } from "@/app/actions/viewer";
import { loadViewerPrefs, useAuthKey } from "./shared/use-is-pro";
import { midnightPreview } from "./shared/theme-transition";
import { access } from "@/lib/plans";

/**
 * Keeps the theme in step with the account, on load and whenever the sign-in
 * changes (login / logout happen without a full page load):
 * - a saved theme is applied on any device (default for everyone: "system",
 *   i.e. the device's own light/dark setting);
 * - nothing saved yet → this device's current choice is saved;
 * - Midnight without Pro (the plan lapsed, or after signing out) falls back to Dark.
 * Signed-out visitors otherwise keep the browser-only choice, as before.
 */
export function ThemePreferenceSync() {
  const { theme, setTheme } = useTheme();
  const authKey = useAuthKey();

  useEffect(() => {
    if (!theme) return;
    let live = true;
    void loadViewerPrefs().then((prefs) => {
      if (!live || midnightPreview.active) return;
      if (!prefs.signedIn) {
        if (theme === "midnight" && !access("midnight_theme", false).allowed) setTheme("dark");
        return;
      }
      const wanted = prefs.theme ?? theme;
      const allowed = wanted === "midnight" && !access("midnight_theme", prefs.isPro).allowed ? "dark" : wanted;
      if (allowed !== theme) setTheme(allowed);
      if (allowed !== prefs.theme) void setThemeAction(allowed as "system" | "light" | "dark" | "midnight").catch(() => {});
    });
    return () => {
      live = false;
    };
    // On load and on sign-in changes only: later picks are saved by the theme picker itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme === undefined, authKey]);

  return null;
}
