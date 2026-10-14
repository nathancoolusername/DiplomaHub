"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemePreferenceSync } from "./ThemePreferenceSync";

export const THEMES = ["light", "dark", "midnight"] as const;
export type Theme = (typeof THEMES)[number];

// Sets data-theme on <html>; globals.css swaps the colour tokens per theme
// (including color-scheme, so enableColorScheme is off to leave that to CSS).
// "system" (the default) follows the device's light/dark setting; midnight is
// only ever picked by hand. Signed-in users' choice is saved to their
// account by ThemePreferenceSync and the theme picker.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      themes={[...THEMES]}
      defaultTheme="system"
      enableSystem
      enableColorScheme={false}
      disableTransitionOnChange
    >
      <ThemePreferenceSync />
      {children}
    </NextThemesProvider>
  );
}
