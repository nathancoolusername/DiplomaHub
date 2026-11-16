// What DiplomaBro's chat costs, from the token counts saved with each reply
// (bro_messages, migration 37). Read-only.
//
//   set -a; . ./.env.local; set +a; node scripts/bro-costs.mjs [days=7]
//
// Prices: Claude Sonnet 5.5 per million tokens. Cache writes are priced as
// 1-hour writes (2x input), the upper bound since the prompt and context are
// cached for an hour. Warm-ups (opening Bro) aren't saved with a reply, so
// they aren't counted here; their cost shows in the server log ("bro warm").

import { createClient } from "@supabase/supabase-js";

const PRICE = { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 4 };
const days = Number(process.argv[2] ?? 7);
const since = new Date(Date.now() - days * 86_400_000).toISOString();

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb
    .from("bro_messages")
    .select("created_at, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens")
    .eq("role", "assistant")
    .not("model", "is", null)
    .gte("created_at", since)
    .order("id")
    .range(from, from + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}

const cost = (r) =>
  ((r.input_tokens ?? 0) * PRICE.input +
    (r.output_tokens ?? 0) * PRICE.output +
    (r.cache_read_tokens ?? 0) * PRICE.cacheRead +
    (r.cache_write_tokens ?? 0) * PRICE.cacheWrite) /
  1e6;

const byDay = new Map();
for (const r of rows) {
  const d = r.created_at.slice(0, 10);
  const x = byDay.get(d) ?? { n: 0, usd: 0, read: 0, write: 0, out: 0 };
  x.n++;
  x.usd += cost(r);
  x.read += r.cache_read_tokens ?? 0;
  x.write += r.cache_write_tokens ?? 0;
  x.out += r.output_tokens ?? 0;
  byDay.set(d, x);
}

console.log(`Bro replies, last ${days} days\n`);
console.log("day         replies   total $   per reply   cache hit   avg out");
let all = { n: 0, usd: 0, read: 0, write: 0 };
for (const [d, x] of [...byDay].sort()) {
  const hit = x.read + x.write ? x.read / (x.read + x.write) : 0;
  console.log(
    `${d}  ${String(x.n).padStart(7)}  ${x.usd.toFixed(3).padStart(8)}  ${(x.usd / x.n).toFixed(4).padStart(10)}  ${`${Math.round(hit * 100)}%`.padStart(10)}  ${String(Math.round(x.out / x.n)).padStart(8)}`,
  );
  all = { n: all.n + x.n, usd: all.usd + x.usd, read: all.read + x.read, write: all.write + x.write };
}
if (all.n) {
  console.log(`\nAll: ${all.n} replies, $${all.usd.toFixed(3)}, $${(all.usd / all.n).toFixed(4)} per reply, cache hit ${Math.round((all.read / (all.read + all.write || 1)) * 100)}%`);
}
