import type { SubjectId } from "./mock-data";

export type SubjectColor = {
  base: string;
  onBase: string;
  // Reserved for whenever real dark-mode theming lands — this codebase has
  // no dark-mode system today (no next-themes, no `dark:` variants, no
  // data-theme attribute), so these aren't consumed by any component yet.
  // Derived programmatically from `base` (see lighten/darken below) rather
  // than hand-picked, since there's no live surface to validate them
  // against — precision doesn't matter for an unused value.
  dark: string;
  onDark: string;
};

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => {
    const c = (num >> shift) & 0xff;
    return Math.min(255, Math.round(c + (255 - c) * amount));
  };
  return `#${[channel(16), channel(8), channel(0)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => {
    const c = (num >> shift) & 0xff;
    return Math.max(0, Math.round(c * (1 - amount)));
  };
  return `#${[channel(16), channel(8), channel(0)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function colorFrom(base: string): SubjectColor {
  return { base, onBase: "#ffffff", dark: lighten(base, 0.45), onDark: darken(base, 0.85) };
}

// Single source of truth for every subject color everywhere on the Hub page
// (task blocks, chips, month-view dots, progress bars). Muted, distinct
// tones — one per real resource subject plus the later-added ones — none
// close to the app's navy --color-primary (#002c98). Red (--color-error) is
// reserved for overdue/due-today states and never used here as a subject
// color. Not exhaustive over every possible SubjectId anymore (a user's own
// custom subject can't have a hand-picked entry here) — getSubjectColor
// below always falls back safely for an id that isn't in this map.
export const SUBJECT_COLORS: Record<string, SubjectColor> = {
  math_aa: colorFrom("#3f8f83"), // teal
  math_ai: colorFrom("#3a8fa3"), // cerulean
  physics: colorFrom("#b3801f"), // amber
  chemistry: colorFrom("#b5567a"), // rose
  biology: colorFrom("#5a9c5e"), // leaf green
  english: colorFrom("#7c5cb5"), // violet
  french: colorFrom("#7a7a2e"), // olive
  history: colorFrom("#a56b3f"), // terracotta
  economics: colorFrom("#5c6bad"), // indigo
  geography: colorFrom("#2f9174"), // jade
  business: colorFrom("#3f7fb0"), // sky
  theatre: colorFrom("#9c4c8f"), // plum
  tok: colorFrom("#a2593a"), // sienna
  ee: colorFrom("#5c6470"), // slate
  general: colorFrom("#6b6b70"), // neutral grey
  cas: colorFrom("#9c7a3f"), // gold
  philosophy: colorFrom("#8f5a3f"), // clay
  psychology: colorFrom("#a34f7a"), // mauve
  ess: colorFrom("#4f8f5a"), // moss
  cs: colorFrom("#4f6fa3"), // steel blue
  sport_science: colorFrom("#b3572f"), // burnt orange
  german: colorFrom("#6b7a3f"), // olive drab
  spanish: colorFrom("#b53f3f"), // brick red
};

// Used for items with no subject (e.g. university deadlines) — deliberately
// neutral, drawn from the app's own outline token rather than a new hue.
export const NEUTRAL_COLOR: SubjectColor = {
  base: "#747685",
  onBase: "#ffffff",
  dark: "#c4c5d6",
  onDark: "#0b1c30",
};

// A small fixed palette to cycle through for custom subjects (not in
// SUBJECT_COLORS above) — picked deterministically from the id so the same
// custom subject always renders the same color across a session, without
// needing to store a color choice anywhere.
const CUSTOM_PALETTE = [
  colorFrom("#5c6bad"), // indigo
  colorFrom("#3f8f83"), // teal
  colorFrom("#a34f7a"), // mauve
  colorFrom("#b3801f"), // amber
  colorFrom("#2f9174"), // jade
  colorFrom("#9c4c8f"), // plum
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getSubjectColor(subjectId: SubjectId | null): SubjectColor {
  if (!subjectId) return NEUTRAL_COLOR;
  const known = SUBJECT_COLORS[subjectId];
  if (known) return known;
  return CUSTOM_PALETTE[hashString(subjectId) % CUSTOM_PALETTE.length];
}
