// Tries to read every Forty-Five table and view with the public anon key, as
// any visitor's browser could. Each must be refused. Read-only.
//   node --experimental-strip-types scripts/forty-five/check-anon.mts

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8").split("\n") : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });

let bad = 0;
let missing = 0;
for (const t of ["forty_five_groups", "forty_five_puzzles", "forty_five_plays", "forty_five_daily_scores", "forty_five_alltime", "forty_five_alltime_by_school", "forty_five_reactions", "forty_five_guest_finishes"]) {
  const { data, error } = await sb.from(t).select("*").limit(1);
  if (error && (error.code === "42501" || /permission denied/i.test(error.message))) console.log(`PASS  ${t}: permission denied`);
  else if (error && (error.code === "PGRST205" || /schema cache|does not exist/i.test(error.message))) {
    missing++;
    console.log(`----  ${t}: doesn't exist yet (run migrations 34–36)`);
  } else {
    bad++;
    console.log(`FAIL  ${t}: anon got ${error ? `error ${error.code} ${error.message}` : `${data?.length ?? 0} row(s) back`}`);
  }
}
const w = await sb.from("forty_five_plays").insert({ user_id: "00000000-0000-0000-0000-000000000000", puzzle_id: "00000000-0000-0000-0000-000000000000" });
if (w.error && (w.error.code === "42501" || /permission denied/i.test(w.error.message))) console.log("PASS  forty_five_plays insert: permission denied");
else if (w.error && missing) console.log("----  forty_five_plays insert: table doesn't exist yet");
else {
  bad++;
  console.log(`FAIL  forty_five_plays insert: ${w.error ? w.error.message : "accepted!"}`);
}
const r = await sb.from("forty_five_reactions").insert({ puzzle_id: "00000000-0000-0000-0000-000000000000", guest_id: "00000000-0000-0000-0000-000000000000", liked: true });
if (r.error && (r.error.code === "42501" || /permission denied/i.test(r.error.message))) console.log("PASS  forty_five_reactions insert: permission denied");
else if (r.error && missing) console.log("----  forty_five_reactions insert: table doesn't exist yet");
else {
  bad++;
  console.log(`FAIL  forty_five_reactions insert: ${r.error ? r.error.message : "accepted!"}`);
}
console.log(bad ? `\n${bad} FAILED` : missing ? "\nNothing leaked, but some tables don't exist yet." : "\nAll refused.");
process.exit(bad ? 1 : 0);
