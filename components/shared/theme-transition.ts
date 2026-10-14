"use client";

// Animated theme switching: the new theme spreads out in a circle from the
// middle of the screen (View Transitions API). Midnight also gets a brief
// ice-blue glow. Falls back to an instant switch where the API isn't
// supported, the user prefers reduced motion, or the tab is hidden.

type SetTheme = (theme: string) => void;

/** True while a 3-second Midnight preview is running (non-Pro users may see Midnight then). */
export const midnightPreview = { active: false };

const THEMES = ["light", "dark", "midnight"];

function resolve(theme: string): string {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function switchTheme(setTheme: SetTheme, next: string): Promise<void> {
  const root = document.documentElement;
  const target = resolve(next);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

  // Hidden tabs don't run animation frames (or view transitions): switch instantly.
  const hidden = document.visibilityState !== "visible";
  if (!doc.startViewTransition || reduced || hidden || root.getAttribute("data-theme") === target) {
    setTheme(next);
    return Promise.resolve();
  }

  return new Promise((done) => {
    // Let the pressed button paint its new state first; the snapshot the
    // transition takes is what makes a click feel laggy otherwise.
    requestAnimationFrame(() => {
      root.classList.add("theme-vt");
      root.classList.toggle("theme-vt-midnight", target === "midnight");
      const transition = doc.startViewTransition!(() => {
        // Apply the attribute ourselves so the new snapshot is already in
        // the new theme; next-themes then catches up (and saves the choice).
        if (THEMES.includes(target)) root.setAttribute("data-theme", target);
        setTheme(next);
      });
      transition.finished.finally(() => {
        root.classList.remove("theme-vt", "theme-vt-midnight");
        done();
      });
    });
  });
}
