// Read-only: lists Forty-Five calendar days with no puzzle, from launch day to
// the last scheduled day (and today), plus the queue that could fill them.
// Never writes.
//   node --experimental-strip-types scripts/forty-five/check-calendar.mts
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { calendarGaps } from "../../lib/forty-five/schedule.ts";
import { LAUNCH_DATE, puzzleNumber, utcToday } from "../../lib/forty-five/dates.ts";

for (const l of fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split("\n") : []) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const { data, error } = await sb.from("forty_five_puzzles").select("slug, status, scheduled_for, updated_at, review_note").eq("mode", "daily").order("slug");
if (error) throw new Error(error.message);
const rows = data as { slug: string; status: string; scheduled_for: string | null; updated_at: string; review_note: string | null }[];
const today = utcToday();
const scheduled = rows.filter((r) => r.scheduled_for).sort((a, b) => a.scheduled_for!.localeCompare(b.scheduled_for!));
const gaps = calendarGaps(scheduled.map((r) => r.scheduled_for!), today);

console.log(`Today (UTC): ${today} = #${puzzleNumber(today)} · launch ${LAUNCH_DATE}`);
console.log(`Scheduled: ${scheduled.length}, ${scheduled[0]?.scheduled_for ?? "–"} to ${scheduled.at(-1)?.scheduled_for ?? "–"}`);
console.log(`Today's puzzle: ${scheduled.find((r) => r.scheduled_for === today)?.slug ?? "NONE"}`);
console.log(gaps.length ? `\nEmpty days (${gaps.length}):` : "\nNo empty days.");
for (const g of gaps) console.log(`  ${g} #${puzzleNumber(g)}${g < today ? " (past)" : g === today ? " (TODAY)" : ""}`);

const queue = rows.filter((r) => r.status === "approved" && !r.scheduled_for);
console.log(`\nApproved, unscheduled (queue): ${queue.length}${queue.length ? ` · ${queue.map((r) => r.slug).join(", ")}` : ""}`);
const recent = rows
  .filter((r) => !r.scheduled_for && r.status !== "approved" && Date.parse(r.updated_at) > Date.now() - 14 * 86_400_000)
  .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  .slice(0, 10);
if (recent.length) {
  console.log("\nPulled or reviewed in the last 14 days (unscheduled, not approved):");
  for (const r of recent) console.log(`  ${r.slug} ${r.status} · updated ${r.updated_at.slice(0, 16)}Z${r.review_note ? ` · note: ${r.review_note.slice(0, 80)}` : ""}`);
}
