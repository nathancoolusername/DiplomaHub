// Validates Forty-Five puzzle files.
//
//   node --experimental-strip-types scripts/forty-five/validate.mts [files or dirs…]
//   (default: content/forty-five/daily)
//
// The rules live in lib/forty-five/checks.ts (the admin page uses the same ones).
// Errors (exit 1): shape, 16 unique words, 4 groups of 4, difficulties 1–4
// each once, unique slugs, ≥1 trap whose word is in the puzzle.
// Warnings: overused words, near-duplicate puzzles, long words/explanations,
// weak traps, fewer than 3 subjects in a daily puzzle.

import fs from "node:fs";
import path from "node:path";
import type { SourcePuzzle } from "../../lib/forty-five/format.ts";
import { checkBank } from "../../lib/forty-five/checks.ts";

const args = process.argv.slice(2);
const targets = args.length ? args : ["content/forty-five/daily"];
const files = targets.flatMap((t) =>
  fs.statSync(t).isDirectory() ? fs.readdirSync(t).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(t, f)) : [t],
);

const parseErrors: string[] = [];
const all: { file: string; p: SourcePuzzle }[] = [];
for (const file of files) {
  try {
    const list = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const p of (Array.isArray(list) ? list : [list]) as SourcePuzzle[]) all.push({ file: path.basename(file), p });
  } catch (e) {
    parseErrors.push(`${file}: invalid JSON (${(e as Error).message})`);
  }
}

const results = checkBank(all.map((x) => x.p));
const errors = [...parseErrors];
const warnings: string[] = [];
const seenReuse = new Set<string>();
for (const { file, p } of all) {
  const r = results.get(p.slug);
  if (!r) continue;
  for (const e of r.errors) errors.push(`${file} ${p.slug}: ${e}`);
  for (const w of r.warnings) {
    // Bank-wide messages are attached to every puzzle involved; print each once.
    if (/is used in \d+ puzzles|near-duplicate of/.test(w)) {
      const key = w.replace(/near-duplicate of \S+/, "near-duplicate");
      if (seenReuse.has(key + (w.includes("near-duplicate") ? [p.slug, w.match(/of (\S+):/)?.[1]].sort().join() : ""))) continue;
      seenReuse.add(key + (w.includes("near-duplicate") ? [p.slug, w.match(/of (\S+):/)?.[1]].sort().join() : ""));
    }
    warnings.push(`${file} ${p.slug}: ${w}`);
  }
}

const bySubject: Record<string, number> = {};
for (const { p } of all) for (const g of p.groups ?? []) bySubject[g.subject] = (bySubject[g.subject] ?? 0) + 1;
const words = new Set(all.flatMap(({ p }) => (p.groups ?? []).flatMap((g) => g.words.map((w) => w.trim().toLowerCase()))));
console.log(`${files.length} files, ${all.length} puzzles, ${words.size} distinct words`);
console.log(`groups by subject: ${Object.entries(bySubject).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${v}`).join(", ")}`);
for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(errors.length ? `\n${errors.length} error(s), ${warnings.length} warning(s)` : `\nOK — ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
