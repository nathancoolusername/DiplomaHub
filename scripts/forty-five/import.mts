// Imports Forty-Five puzzles into Supabase as 'draft'.
//
//   node --experimental-strip-types scripts/forty-five/import.mts [files or dirs…]            # dry run
//   node --experimental-strip-types scripts/forty-five/import.mts [files or dirs…] --commit   # writes
//   (default: content/forty-five/daily)
//
// Runs the validator first and stops if it reports errors.
// Upserts by slug. A puzzle that is still 'draft' is updated in place (its
// groups replaced). One already 'approved' or 'rejected' is skipped, so a
// re-import never undoes your review; pass --force to reset those to draft.
// --force never touches a scheduled puzzle (that would leave its day empty):
// Reject / Unschedule it in Admin first, which refills the day.
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
// and migration 34 (forty_five_bank).

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import type { SourcePuzzle } from "../../lib/forty-five/format.ts";

const args = process.argv.slice(2);
const commit = args.includes("--commit");
const force = args.includes("--force");
const targets = args.filter((a) => !a.startsWith("--"));
if (!targets.length) targets.push("content/forty-five/daily");

try {
  execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "scripts/forty-five/validate.mts", ...targets], { stdio: ["ignore", "ignore", "inherit"] });
} catch {
  console.error("Validator reported errors. Run it on its own to see them:\n  node --experimental-strip-types scripts/forty-five/validate.mts");
  process.exit(1);
}

for (const line of fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split("\n") : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (.env.local).");
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });

const files = targets.flatMap((t) =>
  fs.statSync(t).isDirectory() ? fs.readdirSync(t).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(t, f)) : [t],
);
const puzzles: SourcePuzzle[] = files.flatMap((f) => {
  const j = JSON.parse(fs.readFileSync(f, "utf8"));
  return Array.isArray(j) ? j : [j];
});

const existing = await sb.from("forty_five_puzzles").select("id, slug, status, scheduled_for").in("slug", puzzles.map((p) => p.slug));
if (existing.error) {
  console.error(`Couldn't read forty_five_puzzles: ${existing.error.message}`);
  if (/does not exist|schema cache/i.test(existing.error.message)) console.error("Run migration 34 (supabase/migrations/20261113120000_forty_five_bank.sql) first.");
  process.exit(1);
}
const bySlug = new Map(existing.data.map((r) => [r.slug as string, r as { id: string; slug: string; status: string; scheduled_for: string | null }]));

const plan = { insert: [] as SourcePuzzle[], update: [] as SourcePuzzle[], reset: [] as SourcePuzzle[], skip: [] as string[] };
for (const p of puzzles) {
  const row = bySlug.get(p.slug);
  if (!row) plan.insert.push(p);
  else if (row.status === "draft") plan.update.push(p);
  else if (row.scheduled_for) plan.skip.push(`${p.slug} (scheduled ${row.scheduled_for}; pull it in Admin first)`);
  else if (force) plan.reset.push(p);
  else plan.skip.push(`${p.slug} (${row.status})`);
}

console.log(`${puzzles.length} puzzles in ${files.length} files`);
console.log(`  new drafts:      ${plan.insert.length}`);
console.log(`  update drafts:   ${plan.update.length}`);
console.log(`  reset to draft:  ${plan.reset.length}${force ? "" : " (use --force)"}`);
if (plan.skip.length) console.log(`  skipped, already reviewed: ${plan.skip.join(", ")}`);
if (!commit) {
  console.log("\nDry run. Add --commit to write.");
  process.exit(0);
}

let done = 0;
for (const p of [...plan.insert, ...plan.update, ...plan.reset]) {
  const up = await sb
    .from("forty_five_puzzles")
    .upsert(
      { slug: p.slug, mode: p.mode, subject: p.subject, traps: p.traps, status: "draft", scheduled_for: null, reviewed_at: null, updated_at: new Date().toISOString() },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (up.error) throw new Error(`${p.slug}: ${up.error.message}`);
  const id = up.data.id as string;
  const del = await sb.from("forty_five_groups").delete().eq("puzzle_id", id);
  if (del.error) throw new Error(`${p.slug}: ${del.error.message}`);
  const ins = await sb.from("forty_five_groups").insert(
    p.groups.map((g) => ({ puzzle_id: id, difficulty: g.difficulty, label: g.label, subject: g.subject, words: g.words.map((w) => w.trim()), explanation: g.explanation })),
  );
  if (ins.error) throw new Error(`${p.slug}: ${ins.error.message} (puzzle row written, groups not; re-run to fix)`);
  done++;
}
console.log(`\nWrote ${done} puzzles as draft.`);
