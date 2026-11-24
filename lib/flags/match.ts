// Flags: turning what someone typed into a country. Used by the game (instant
// feedback) and the server (re-checking a finished run's answers).

import { COUNTRIES } from "./countries.ts";

/**
 * "Côte d'Ivoire" → "cotedivoire", "St. Lucia" → "saintlucia",
 * "The Bahamas" → "bahamas", "Bosnia & Herzegovina" → "bosniaandherzegovina".
 */
export function normalize(text: string): string {
  const words = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => (w === "st" ? "saint" : w));
  if (words[0] === "the" && words.length > 1) words.shift();
  return words.join("");
}

/** Every accepted spelling (normalised) → its country code. */
export const NAMES: ReadonlyMap<string, string> = (() => {
  const m = new Map<string, string>();
  for (const c of COUNTRIES)
    for (const n of [c.name, ...c.aliases]) {
      const k = normalize(n);
      const had = m.get(k);
      if (had && had !== c.code) throw new Error(`flags: "${n}" means both ${had} and ${c.code}`);
      m.set(k, c.code);
    }
  return m;
})();

export type Match =
  /** Not a name of anything still on the board. */
  | { code: null }
  /** A country. `wait` = it's also the start of another unnamed country ("Niger" → "Nigeria"), so give them a moment to keep typing. */
  | { code: string; wait: boolean };

/** What `typed` names among `open` (the codes not named yet on this board). */
export function match(typed: string, open: ReadonlySet<string>): Match {
  const k = normalize(typed);
  if (!k) return { code: null };
  const code = NAMES.get(k);
  if (!code || !open.has(code)) return { code: null };
  for (const [name, other] of NAMES) if (other !== code && name.length > k.length && name.startsWith(k) && open.has(other)) return { code, wait: true };
  return { code, wait: false };
}
