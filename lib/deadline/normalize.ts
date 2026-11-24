// Deadline's text rules in TypeScript, matching dl_normalize / dl_squash
// (migration 56): lower case, accents off, µ → μ, modifier letters (ʻ)
// dropped, & → and, other punctuation → space, a leading the/a/an dropped.
// Used by Admin to group what players typed; the game itself matches in SQL.

export function normalize(s: string): string {
  let t = s.replace(/µ/g, "μ").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[ʰ-˿]/g, "");
  t = t.replace(/&/g, " and ").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  return t.replace(/^(the|a|an) /, "");
}

export const squash = (s: string) => normalize(s).replace(/ /g, "");

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
