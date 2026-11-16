// Tests migration 35 (Forty-Five plays and leaderboard views) on PGlite, on top of 34.
//   node --experimental-strip-types scripts/forty-five/test-plays.mts

import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
let passed = 0;
let failed = 0;
const ok = (cond: boolean, name: string) => (cond ? passed++ : (failed++, console.log(`FAIL ${name}`)));
async function expectError(sql: string, match: RegExp, name: string) {
  try {
    await db.exec(sql);
    ok(false, `${name} (no error)`);
  } catch (e) {
    ok(match.test((e as Error).message), `${name}: ${(e as Error).message}`);
  }
}
const one = async <T,>(sql: string) => (await db.query<T>(sql)).rows[0];

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  grant usage on schema public to anon, authenticated, service_role;
  create table public.users (id uuid primary key, display_name text, hide_from_leaderboard boolean not null default false);
  grant all on public.users to service_role;
`);
for (const f of ["20261113120000_forty_five_bank.sql", "20261114120000_forty_five_plays.sql"]) {
  const sql = fs.readFileSync(`supabase/migrations/${f}`, "utf8");
  await db.exec(sql);
  await db.exec(sql);
}
ok(true, "migrations 34 and 35 run twice");

const A = "00000000-0000-0000-0000-00000000000a", B = "00000000-0000-0000-0000-00000000000b", C = "00000000-0000-0000-0000-00000000000c";
await db.exec(`
  insert into users values ('${A}', 'Ana', false), ('${B}', 'Ben', false), ('${C}', 'Cat', true);
  insert into forty_five_puzzles (id, slug, mode, status, scheduled_for) values
    ('10000000-0000-0000-0000-000000000001', 'd-001', 'daily', 'approved', '2026-11-10'),
    ('10000000-0000-0000-0000-000000000002', 'd-002', 'daily', 'approved', '2026-11-11');
`);
await db.exec("set role service_role");
const P1 = "10000000-0000-0000-0000-000000000001", P2 = "10000000-0000-0000-0000-000000000002";

// Insert: the clock and counters are the server's, whatever is sent.
await db.exec(`insert into forty_five_plays (user_id, puzzle_id, started_at, finished_at, score, mistakes, counts_for_leaderboard)
  values ('${A}', '${P1}', '2000-01-01', '2000-01-01', 45, 0, true)`);
const a = await one<{ started_at: Date; finished_at: Date | null; score: number | null }>(`select * from forty_five_plays where user_id = '${A}'`);
ok(a.finished_at === null && a.score === null && a.started_at.getFullYear() > 2020, "insert ignores sent times and score");
await expectError(`insert into forty_five_plays (user_id, puzzle_id) values ('${A}', '${P1}')`, /unique|duplicate/, "one play per student per puzzle");
await db.exec(`insert into forty_five_plays (user_id, puzzle_id) values ('${A}', '${P1}') on conflict do nothing`);
ok((await one<{ n: number }>(`select count(*)::int n from forty_five_plays where user_id='${A}'`)).n === 1, "re-opening (on conflict do nothing) keeps the first start");

await expectError(`update forty_five_plays set started_at = now() - interval '1 hour', guess_count = 1 where user_id = '${A}'`, /fixed/, "start time can't be moved");
await expectError(`update forty_five_plays set guess_count = 2 where user_id = '${A}'`, /one guess/, "guesses recorded one at a time");
await db.exec(`update forty_five_plays set guess_count = 1, mistakes = 1, guesses = '[{"r":"wrong"}]' where user_id = '${A}'`);
await db.exec(`update forty_five_plays set guess_count = 2, groups_found = 4, score = 41, finished_at = '2000-01-01' where user_id = '${A}'`);
const fin = await one<{ finished_at: Date; started_at: Date }>(`select * from forty_five_plays where user_id = '${A}'`);
ok(fin.finished_at.getFullYear() > 2020 && fin.finished_at >= fin.started_at, "finished_at is the database clock");
await expectError(`update forty_five_plays set guess_count = 3, score = 45 where user_id = '${A}'`, /finished/, "a finished play can't change");
await expectError(`update forty_five_plays set guess_count = 1 where user_id = '${B}' and false; insert into forty_five_plays (user_id, puzzle_id) values ('${B}', '${P1}'); update forty_five_plays set guess_count = 1, score = 30 where user_id = '${B}'`, /forty_five_plays_score/, "score only with a finish");
await db.exec("reset role; set role service_role");

// Leaderboards
await db.exec(`
  insert into forty_five_plays (user_id, puzzle_id, counts_for_leaderboard) values ('${B}', '${P1}', true), ('${C}', '${P1}', true), ('${B}', '${P2}', true), ('${A}', '${P2}', false);
  update forty_five_plays set guess_count = 1, groups_found = 4, score = 45, finished_at = now() where user_id in ('${B}', '${C}');
  update forty_five_plays set guess_count = 1, groups_found = 4, score = 45, finished_at = now() where user_id = '${A}' and puzzle_id = '${P2}';
`);
const daily = (await db.query<{ display_name: string; score: number }>(`select * from forty_five_daily_scores where puzzle_date = '2026-11-10' order by score desc, seconds`)).rows;
ok(daily.length === 2 && daily[0].display_name === "Ben" && daily[1].display_name === "Ana", "daily: hidden student left out, ordered by score");
const all = (await db.query<{ display_name: string; total: number; games: number }>(`select * from forty_five_alltime order by total desc`)).rows;
ok(all.length === 2 && all[0].display_name === "Ben" && all[0].total === 90 && all[0].games === 2 && all[1].total === 41, "all-time: sums only counted plays");
await db.exec("reset role");

for (const role of ["anon", "authenticated"]) {
  await db.exec(`set role ${role}`);
  for (const t of ["forty_five_plays", "forty_five_daily_scores", "forty_five_alltime", "forty_five_alltime_by_school", "forty_five_groups", "forty_five_puzzles"])
    await expectError(`select * from public.${t}`, /permission denied/, `${role} can't read ${t}`);
  await expectError(`insert into public.forty_five_plays (user_id, puzzle_id) values ('${A}', '${P2}')`, /permission denied/, `${role} can't write plays`);
  await db.exec("reset role");
}

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
