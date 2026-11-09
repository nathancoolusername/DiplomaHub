// Forty-Five puzzle checks, shared by scripts/forty-five/validate.mts and
// the admin review page (/admin/forty-five). Pure: no I/O.

import { GROUP_SUBJECTS, SUBJECTS, type SourcePuzzle } from "./format.ts";

export const MAX_REUSE = 2; // a word may appear in at most this many puzzles
export const NEAR_DUP_WORDS = 6;
export const MAX_WORD_LEN = 14;
export const MAX_EXPLANATION = 160;

export type CheckResult = { errors: string[]; warnings: string[] };

export const normWord = (w: string) => w.trim().toLowerCase().replace(/\s+/g, " ");

/** Rules for one puzzle on its own. Errors block import and approval. */
export function checkPuzzle(p: SourcePuzzle): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!p || typeof p.slug !== "string" || !/^[a-z0-9-]+$/.test(p.slug)) return { errors: ["bad slug"], warnings };
  if (p.mode !== "daily" && p.mode !== "subject") errors.push("mode must be daily or subject");
  if (p.mode === "daily" && p.subject !== null) errors.push("daily puzzles must have subject null");
  if (p.mode === "subject" && !SUBJECTS.includes(p.subject as never)) errors.push("subject puzzle needs a known subject");
  if (!Array.isArray(p.groups) || p.groups.length !== 4) return { errors: [...errors, "needs exactly 4 groups"], warnings };

  const diffs = p.groups.map((g) => g.difficulty).sort().join(",");
  if (diffs !== "1,2,3,4") errors.push(`difficulties must be 1, 2, 3, 4 once each (got ${diffs})`);

  const words: string[] = [];
  for (const g of p.groups) {
    if (!g.label?.trim()) errors.push("group without a label");
    if (!GROUP_SUBJECTS.includes(g.subject)) errors.push(`"${g.label}": unknown subject "${g.subject}"`);
    if (p.mode === "subject" && g.subject !== p.subject) errors.push(`"${g.label}": subject puzzles use one subject only`);
    if (!Array.isArray(g.words) || g.words.length !== 4) errors.push(`"${g.label}": needs 4 words`);
    if (!g.explanation?.trim()) errors.push(`"${g.label}": missing explanation`);
    else if (g.explanation.length > MAX_EXPLANATION) warnings.push(`"${g.label}": explanation is ${g.explanation.length} characters`);
    for (const w of g.words ?? []) {
      if (typeof w !== "string" || !w.trim()) {
        errors.push(`"${g.label}": empty word`);
        continue;
      }
      if (w.length > MAX_WORD_LEN) warnings.push(`"${w}" is ${w.length} characters (tile may wrap)`);
      if (normWord(g.label).split(/[^a-z0-9'-]+/).includes(normWord(w))) warnings.push(`"${w}" appears in its own label`);
      words.push(normWord(w));
    }
  }
  if (words.length !== 16) errors.push(`has ${words.length} words, needs 16`);
  const dupes = [...new Set(words.filter((w, i) => words.indexOf(w) !== i))];
  if (dupes.length) errors.push(`repeated words: ${dupes.join(", ")}`);

  const subjects = new Set(p.groups.map((g) => g.subject));
  if (p.mode === "daily" && subjects.size < 3) warnings.push(`only ${subjects.size} subjects`);

  if (p.mode === "daily" && (!Array.isArray(p.traps) || p.traps.length === 0)) errors.push("needs at least one cross-subject trap");
  for (const t of p.traps ?? []) {
    if (!words.includes(normWord(t.word))) errors.push(`trap word "${t.word}" isn't in the puzzle`);
    if (!t.decoy?.trim() || !t.why?.trim()) errors.push(`trap "${t.word}" needs a decoy and a why`);
    const home = p.groups.find((g) => g.words.some((w) => normWord(w) === normWord(t.word)));
    const decoy = p.groups.find((g) => normWord(g.label) === normWord(t.decoy));
    if (!decoy) warnings.push(`trap "${t.word}": decoy "${t.decoy}" isn't a group in this grid (weaker red herring)`);
    else if (home && decoy === home) errors.push(`trap "${t.word}": decoy is its own group`);
    else if (home && decoy.subject === home.subject && home.subject !== "Mixed" && p.mode === "daily")
      warnings.push(`trap "${t.word}": decoy group is the same subject (not cross-subject)`);
  }
  return { errors, warnings };
}

/** Rules across the whole bank: duplicate slugs, overused words, near-duplicate puzzles. Keyed by slug. */
export function checkBank(puzzles: SourcePuzzle[]): Map<string, CheckResult> {
  const out = new Map<string, CheckResult>(puzzles.map((p) => [p.slug, checkPuzzle(p)]));
  const add = (slug: string, kind: keyof CheckResult, msg: string) => out.get(slug)?.[kind].push(msg);

  const seen = new Map<string, number>();
  for (const p of puzzles) seen.set(p.slug, (seen.get(p.slug) ?? 0) + 1);
  for (const [slug, n] of seen) if (n > 1) add(slug, "errors", `slug used ${n} times`);

  const use = new Map<string, string[]>();
  for (const p of puzzles) for (const w of new Set(p.groups.flatMap((g) => g.words.map(normWord)))) use.set(w, [...(use.get(w) ?? []), p.slug]);
  for (const [w, slugs] of use)
    if (slugs.length > MAX_REUSE) for (const s of slugs) add(s, "warnings", `"${w}" is used in ${slugs.length} puzzles (${slugs.join(", ")})`);

  const groupKey = (ws: string[]) => ws.map(normWord).sort().join("|");
  for (let i = 0; i < puzzles.length; i++)
    for (let j = i + 1; j < puzzles.length; j++) {
      const a = puzzles[i];
      const b = puzzles[j];
      const ga = new Set(a.groups.map((g) => groupKey(g.words)));
      const same = b.groups.find((g) => ga.has(groupKey(g.words)));
      const wa = new Set(a.groups.flatMap((g) => g.words.map(normWord)));
      const shared = b.groups.flatMap((g) => g.words.map(normWord)).filter((w) => wa.has(w)).length;
      const labels = b.groups.filter((g) => a.groups.some((h) => normWord(h.label) === normWord(g.label)));
      const msgs: string[] = [];
      if (same) msgs.push(`identical group "${same.label}"`);
      else if (shared >= NEAR_DUP_WORDS) msgs.push(`${shared} shared words`);
      if (labels.length >= 2) msgs.push(`shared labels ${labels.map((g) => `"${g.label}"`).join(", ")}`);
      for (const m of msgs) {
        add(a.slug, "warnings", `near-duplicate of ${b.slug}: ${m}`);
        add(b.slug, "warnings", `near-duplicate of ${a.slug}: ${m}`);
      }
    }
  return out;
}
