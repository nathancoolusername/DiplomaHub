// Tests migration 34 (Forty-Five puzzle bank) on an in-memory Postgres (PGlite):
// runs twice, every puzzle in content/forty-five/daily fits the schema, anon and
// authenticated can't read answers even with a grant, and the scheduling rules hold.
//
//   node --experimental-strip-types scripts/forty-five/test-bank.mts

import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import type { SourcePuzzle } from "../../lib/forty-five/format.ts";

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

// Supabase-like roles; anon/authenticated get table grants by default here,
// as on a project without migration 29, to prove the migration revokes them.
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  grant usage on schema public to anon, authenticated, service_role;
`);
const migration = fs.readFileSync("supabase/migrations/20261113120000_forty_five_bank.sql", "utf8");
await db.exec(migration);
await db.exec(migration);
ok(true, "migration runs twice");

const dir = "content/forty-five/daily";
const puzzles: SourcePuzzle[] = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
await db.exec("set role service_role");
for (const p of puzzles) {
  const r = await db.query<{ id: string }>(
    "insert into public.forty_five_puzzles (slug, mode, subject, traps) values ($1, $2, $3, $4) returning id",
    [p.slug, p.mode, p.subject, JSON.stringify(p.traps)],
  );
  for (const g of p.groups)
    await db.query("insert into public.forty_five_groups (puzzle_id, difficulty, label, subject, words, explanation) values ($1,$2,$3,$4,$5,$6)",
      [r.rows[0].id, g.difficulty, g.label, g.subject, g.words, g.explanation]);
}
const counts = await db.query<{ p: number; g: number }>("select (select count(*) from forty_five_puzzles)::int p, (select count(*) from forty_five_groups)::int g");
ok(counts.rows[0].p === puzzles.length && counts.rows[0].g === puzzles.length * 4, `all ${puzzles.length} puzzles and ${puzzles.length * 4} groups stored`);

// Scheduling rules
await expectError("update forty_five_puzzles set scheduled_for = '2026-11-10' where slug = 'd-001'", /forty_five_puzzles_schedule/, "draft can't be scheduled");
await db.exec("update forty_five_puzzles set status = 'approved', scheduled_for = '2026-11-10' where slug = 'd-001'");
const n = await db.query<{ number: number }>("select number from forty_five_puzzles where slug = 'd-001'");
ok(n.rows[0].number === 1, "2026-11-10 is #1");
await db.exec("update forty_five_puzzles set status = 'approved', scheduled_for = '2026-11-21' where slug = 'd-002'");
ok((await db.query<{ number: number }>("select number from forty_five_puzzles where slug = 'd-002'")).rows[0].number === 12, "2026-11-21 is #12");
await db.exec("update forty_five_puzzles set status = 'approved' where slug = 'd-003'");
await expectError("update forty_five_puzzles set scheduled_for = '2026-11-10' where slug = 'd-003'", /unique|duplicate/, "one puzzle per day");
await expectError("update forty_five_puzzles set scheduled_for = '2026-11-09' where slug = 'd-003'", /first_day/, "nothing before launch");
await expectError("update forty_five_puzzles set status = 'rejected' where slug = 'd-001'", /forty_five_puzzles_schedule/, "can't reject while scheduled");
await expectError("insert into forty_five_puzzles (slug, mode, subject) values ('s-1', 'subject', null)", /forty_five_puzzles_subject/, "subject mode needs a subject");
await expectError("insert into forty_five_puzzles (slug, mode, subject) values ('x-1', 'daily', 'Biology')", /forty_five_puzzles_subject/, "daily has no subject");
const pid = (await db.query<{ id: string }>("select id from forty_five_puzzles where slug = 'd-004'")).rows[0].id;
await expectError(`insert into forty_five_groups (puzzle_id, difficulty, label, subject, words, explanation) values ('${pid}', 1, 'x', 'x', '{a,b,c}', 'x')`, /check/, "groups need 4 words");
await expectError(`insert into forty_five_groups (puzzle_id, difficulty, label, subject, words, explanation) values ('${pid}', 1, 'x', 'x', '{a,b,c,d}', 'x')`, /unique|duplicate/, "one group per difficulty");
await db.exec("reset role");

// Answers are unreadable from the browser roles, even with a direct grant.
for (const role of ["anon", "authenticated"]) {
  await db.exec(`set role ${role}`);
  await expectError("select * from public.forty_five_groups", /permission denied/, `${role} can't read groups`);
  await expectError("select * from public.forty_five_puzzles", /permission denied/, `${role} can't read puzzles`);
  await expectError("insert into public.forty_five_puzzles (slug, mode) values ('hack', 'daily')", /permission denied/, `${role} can't write puzzles`);
  await db.exec("reset role");
}
await db.exec("grant select on public.forty_five_groups to anon");
await db.exec("set role anon");
const leaked = await db.query("select * from public.forty_five_groups");
ok(leaked.rows.length === 0, "RLS with no policies: an accidental grant still returns 0 rows");
await db.exec("reset role");

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
