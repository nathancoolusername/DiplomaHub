// Unit tests for Flags: country data, name matching, the daily sprint and run checks.
//   node --experimental-strip-types scripts/flags/test-match.mts

import fs from "node:fs";
import { ALL_CODES, BY_CODE, COUNTRIES, EVERY_PLACE, HARD_CODES, TERRITORIES } from "../../lib/flags/countries.ts";
import { match, NAMES, normalize } from "../../lib/flags/match.ts";
import { dailyCodes, sprintNumber } from "../../lib/flags/daily.ts";
import { checkRun } from "../../lib/flags/engine.ts";
import { FLAGS } from "../../lib/flags/config.ts";

let passed = 0, failed = 0;
const ok = (c: boolean, n: string) => (c ? passed++ : (failed++, console.log(`FAIL ${n}`)));
const all = new Set(ALL_CODES);
const hard = new Set(HARD_CODES);

// Data
ok(COUNTRIES.length === 197, `197 countries (got ${COUNTRIES.length})`);
ok(new Set(ALL_CODES).size === ALL_CODES.length, "codes unique");
ok(ALL_CODES.every((c) => /^[a-z]{2}$/.test(c)), "country codes are 2 letters");
ok(TERRITORIES.length === 58 && HARD_CODES.length === 255, `hard mode is 255 (got ${HARD_CODES.length})`);
for (const c of ["aq-bat", "bq-bo", "bq-se", "bq-sa", "wf", "pm", "bl", "ic", "pt-ac", "pt-ma", "gf", "md-tr", "ge-so", "ge-ab"]) ok(BY_CODE.get(c)?.territory === true, `${c} is a hard-mode territory`);
ok(!fs.readFileSync("public/flags/gf.svg", "utf8").includes("flag-icons"), "gf.svg is French Guiana's own flag, not flag-icons' French flag");
ok(!fs.readFileSync("public/flags/sh-ta.svg", "utf8").includes("flag-icons"), "sh-ta.svg is Tristan da Cunha's flag from Commons (flag-icons' copy shows a Saint Helena shield)");
ok(match("Canaries", hard).code === "ic" && match("Azores", hard).code === "pt-ac" && match("Transnistria", hard).code === "md-tr" && match("French Guyana", hard).code === "gf", "new hard-mode spellings");
ok(!BY_CODE.has("mf"), "Saint Martin (French side) left out: no flag of its own");
ok(!fs.readFileSync("public/flags/wf.svg", "utf8").includes("flag-icons"), "wf.svg is the local flag from Commons, not flag-icons' French flag");
ok(new Set(HARD_CODES).size === HARD_CODES.length, "hard codes unique");
ok(HARD_CODES.every((c) => /^[a-z]{2}(-[a-z]{2,3})?$/.test(c) && c.length <= 6), "hard codes fit the API (≤ 6 chars)");
for (const c of HARD_CODES) ok(fs.existsSync(`public/flags/${c}.svg`), `svg for ${c}`);
for (const c of ["re", "gp", "sj", "bq", "um", "hm", "gb-nir", "yt"]) ok(!BY_CODE.has(c), `${c} left out (no flag of its own)`);
ok(match("Statia", hard).code === "bq-se" && match("St Barths", hard).code === "bl" && match("Wallis & Futuna", hard).code === "wf", "new territory spellings");
ok(BY_CODE.has("tw") && BY_CODE.has("xk") && BY_CODE.has("ps") && BY_CODE.has("va"), "Taiwan, Kosovo, Palestine, Vatican included");
for (const t of [1, 2, 3]) ok(COUNTRIES.filter((c) => c.tier === t).length >= FLAGS.dailyMix[t as 1 | 2 | 3] * 3, `tier ${t} has enough for the sprint`);

// Every name and alias finds its own country (or territory, in hard mode)
for (const c of EVERY_PLACE)
  for (const n of [c.name, ...c.aliases]) {
    const m = match(n, hard);
    ok(m.code === c.code, `"${n}" → ${c.code} (got ${m.code})`);
  }
// Territories never match outside hard mode, and the sprint is countries only
ok(match("Greenland", all).code === null && match("Scotland", all).code === null, "territories don't count in all flags");
ok(match("Greenland", hard).code === "gl" && match("England", hard).code === "gb-eng", "territories count in hard mode");
ok(match("Virgin Islands", hard).code === null, "plain 'Virgin Islands' is ambiguous: no match");
ok(match("St Helena", hard).code === "sh-hl" && match("curacao", hard).code === "cw" && match("macao", hard).code === "mo", "territory spellings");
ok((match("Samoa", hard) as { wait: boolean }).wait === false, "Samoa doesn't wait (American Samoa doesn't start with it)");

// Normalising
ok(normalize("Côte d'Ivoire") === "cotedivoire", "accents and apostrophes");
ok(normalize("  St. Lucia ") === "saintlucia", "St. → Saint");
ok(normalize("The Bahamas") === "bahamas", "leading the");
ok(normalize("Bosnia & Herzegovina") === normalize("bosnia and herzegovina"), "& = and");
ok(match("cote divoire", all).code === "ci", "Ivory Coast without accents");
ok(match("TÜRKİYE", all).code === "tr" || match("turkiye", all).code === "tr", "Türkiye");
ok(match("st vincent and the grenadines", all).code === "vc", "St Vincent full");
ok(match("Guinea Bissau", all).code === "gw", "Guinea Bissau without hyphen");

// Not names
ok(match("", all).code === null, "empty");
ok(match("Fran", all).code === null, "half a name");
ok(match("England", all).code === null, "England isn't the UK flag");
ok(match("Greenland", all).code === null, "territories not in v1");

// Prefix waits
ok((match("Niger", all) as { wait: boolean }).wait === true, "Niger waits for Nigeria");
ok((match("Guinea", all) as { wait: boolean }).wait === true, "Guinea waits for Guinea-Bissau");
ok((match("Dominica", all) as { wait: boolean }).wait === true, "Dominica waits for Dominican Republic");
ok((match("Congo", all) as { wait: boolean }).wait === true, "Congo waits for Congo-Kinshasa");
ok((match("Nigeria", all) as { wait: boolean }).wait === false, "Nigeria accepts at once");
ok((match("France", all) as { wait: boolean }).wait === false, "France accepts at once");
ok((match("Antigua", all) as { wait: boolean }).wait === false, "same-country longer names don't wait");
const noNigeria = new Set(ALL_CODES.filter((c) => c !== "ng"));
ok((match("Niger", noNigeria) as { wait: boolean }).wait === false, "Niger accepts at once once Nigeria is named");
ok(match("France", new Set(["de", "it"])).code === null, "off-board country does nothing");
ok(match("france", new Set(ALL_CODES.filter((c) => c !== "fr"))).code === null, "already named does nothing");

// Daily sprint
const d1 = dailyCodes("2026-11-25");
ok(d1.length === 20 && new Set(d1).size === 20, "20 different flags");
ok(d1.every((c) => all.has(c)), "sprint is countries only");
ok(JSON.stringify(d1) === JSON.stringify(dailyCodes("2026-11-25")), "same every time");
ok(JSON.stringify(d1) !== JSON.stringify(dailyCodes("2026-11-26")), "changes by day");
for (const t of [1, 2, 3] as const) ok(d1.filter((c) => BY_CODE.get(c)!.tier === t).length === FLAGS.dailyMix[t], `tier ${t} count`);
ok(sprintNumber(FLAGS.launchDate) === 1, "launch day is #1");
let repeats = 0;
for (let i = 0; i < 60; i++) {
  const day = new Date(Date.parse(`${FLAGS.launchDate}T00:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10);
  const next = new Date(Date.parse(day) + 86_400_000).toISOString().slice(0, 10);
  const a = new Set(dailyCodes(day));
  for (const c of dailyCodes(next)) if (a.has(c)) repeats++;
  ok(new Set(dailyCodes(day)).size === 20, `day ${day} has 20 different`);
}
ok(repeats === 0, `no back-to-back repeats (${repeats} in 60 days)`);

// Run checks
const board = ["fr", "de", "it", "es", "pt"];
const r1 = checkRun("daily", board, [{ code: "fr", ms: 2000 }, { code: "de", ms: 5000 }, { code: "fr", ms: 6000 }, { code: "gb", ms: 7000 }], 10_000);
ok(r1.correct === 2 && r1.seconds === 10, "duplicates and off-board dropped; time = server elapsed");
const r2 = checkRun("daily", board, [{ code: "fr", ms: 5000 }, { code: "de", ms: 2000 }], 10_000);
ok(r2.correct === 1, "out-of-order answer dropped");
const r3 = checkRun("daily", board, [{ code: "fr", ms: 2000 }, { code: "de", ms: 30_000 }], 10_000);
ok(r3.correct === 1, "answer after server elapsed dropped");
const r4 = checkRun("daily", board, [{ code: "fr", ms: 2000 }], 400_000);
ok(r4.seconds === 300, "capped run ranks at the cap");
const r5 = checkRun("daily", board, [{ code: "fr", ms: 1000 }, { code: "de", ms: 1300 }, { code: "it", ms: 1600 }], 5_000);
ok(!r5.plausible, "three in 600 ms isn't a person");
const r6 = checkRun("daily", board, board.map((code, i) => ({ code, ms: 2000 + i * 1500 })), 9_000);
ok(r6.plausible && r6.correct === 5 && r6.seconds === 9, "a fast human run counts");
const big = ALL_CODES.slice(0, 20);
const r7 = checkRun("all", ALL_CODES, big.map((code, i) => ({ code, ms: 500 + i * 460 })), 9_000);
ok(!r7.plausible, "20 flags in 9 s isn't a person");
ok(!checkRun("daily", board, [], 10_000).plausible, "nothing named doesn't count");
ok(NAMES.size > 260, "lots of accepted names");

console.log(`${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
