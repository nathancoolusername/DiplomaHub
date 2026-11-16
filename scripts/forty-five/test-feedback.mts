// Tests migration 36 (Forty-Five likes and guest finishes) on PGlite, on top of 34–35.
//   node --experimental-strip-types scripts/forty-five/test-feedback.mts

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
const count = async (sql: string) => Number((await db.query<{ n: number }>(sql)).rows[0].n);

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  grant usage on schema public to anon, authenticated, service_role;
  create table public.users (id uuid primary key, display_name text, hide_from_leaderboard boolean not null default false);
  grant all on public.users to service_role;
`);
for (const f of ["20261113120000_forty_five_bank.sql", "20261114120000_forty_five_plays.sql", "20261115120000_forty_five_feedback.sql"]) {
  const sql = fs.readFileSync(`supabase/migrations/${f}`, "utf8");
  await db.exec(sql);
  await db.exec(sql);
}
ok(true, "migrations 34–36 run twice");

const A = "00000000-0000-0000-0000-00000000000a";
const G = "20000000-0000-0000-0000-000000000001";
const P = "10000000-0000-0000-0000-000000000001";
await db.exec(`
  insert into users values ('${A}', 'Ana', false);
  insert into forty_five_puzzles (id, slug, mode, status, scheduled_for) values ('${P}', 'd-001', 'daily', 'approved', '2026-11-10');
`);

await db.exec("set role service_role");
await db.exec(`insert into forty_five_reactions (puzzle_id, user_id, liked) values ('${P}', '${A}', true)`);
await db.exec(`insert into forty_five_reactions (puzzle_id, guest_id, liked) values ('${P}', '${G}', false)`);
ok((await count("select count(*) n from forty_five_reactions")) === 2, "service role writes a user and a guest reaction");
await expectError(`insert into forty_five_reactions (puzzle_id, user_id, liked) values ('${P}', '${A}', false)`, /duplicate key/, "one reaction per user per puzzle");
await expectError(`insert into forty_five_reactions (puzzle_id, guest_id, liked) values ('${P}', '${G}', true)`, /duplicate key/, "one reaction per guest per puzzle");
await expectError(`insert into forty_five_reactions (puzzle_id, liked) values ('${P}', true)`, /forty_five_reactions_who/, "reaction needs a user or a guest");
await expectError(`insert into forty_five_reactions (puzzle_id, user_id, guest_id, liked) values ('${P}', '${A}', '${G}', true)`, /forty_five_reactions_who/, "not both");

await db.exec(`insert into forty_five_guest_finishes (puzzle_id, guest_id, score, mistakes, groups_found) values ('${P}', '${G}', 41, 1, 4)`);
await expectError(`insert into forty_five_guest_finishes (puzzle_id, guest_id, score, mistakes, groups_found) values ('${P}', '${G}', 45, 0, 4)`, /duplicate key/, "one guest finish per browser per puzzle");
await expectError(`insert into forty_five_guest_finishes (puzzle_id, guest_id, score, mistakes, groups_found) values ('${P}', gen_random_uuid(), 46, 0, 4)`, /check/, "score capped at 45");
await db.exec("reset role");

for (const role of ["anon", "authenticated"]) {
  await db.exec(`set role ${role}`);
  for (const t of ["forty_five_reactions", "forty_five_guest_finishes"]) {
    await expectError(`select * from ${t}`, /permission denied/, `${role} can't read ${t}`);
    await expectError(`delete from ${t}`, /permission denied/, `${role} can't delete ${t}`);
  }
  await expectError(`insert into forty_five_reactions (puzzle_id, guest_id, liked) values ('${P}', gen_random_uuid(), true)`, /permission denied/, `${role} can't insert a reaction`);
  await db.exec("reset role");
}

await db.exec(`delete from users where id = '${A}'`);
ok((await count("select count(*) n from forty_five_reactions where user_id is not null")) === 0, "deleting a user removes their reactions");

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
