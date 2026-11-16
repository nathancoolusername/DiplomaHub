// Deletes test plays on one puzzle (after trying it early in local dev).
//   node --experimental-strip-types scripts/forty-five/delete-test-play.mts d-003            # dry run
//   node --experimental-strip-types scripts/forty-five/delete-test-play.mts d-003 --commit
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
for (const l of fs.readFileSync(".env.local", "utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ""); }
const slug = process.argv[2];
if (!slug) throw new Error("Usage: delete-test-play.mts <slug> [--commit]");
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const { data: p } = await sb.from("forty_five_puzzles").select("id, scheduled_for").eq("slug", slug).single();
if (!p) throw new Error(`No puzzle ${slug}`);
if (p.scheduled_for && p.scheduled_for <= new Date().toISOString().slice(0, 10)) throw new Error(`${slug} is live or past; refusing to delete real plays.`);
const { data: plays } = await sb.from("forty_five_plays").select("id, user_id, score, finished_at").eq("puzzle_id", p.id);
console.log(`${plays?.length ?? 0} play(s) on ${slug} (${p.scheduled_for}):`, plays);
if (process.argv.includes("--commit") && plays?.length) {
  const { error } = await sb.from("forty_five_plays").delete().eq("puzzle_id", p.id);
  if (error) throw error;
  console.log("Deleted.");
}
