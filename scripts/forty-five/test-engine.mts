// Unit tests for the Forty-Five engine, scoring and stats.
//   node --experimental-strip-types scripts/forty-five/test-engine.mts

import { apply, emptyState, evaluate, replay, shareGrid, shuffledWords, type Group } from "../../lib/forty-five/engine.ts";
import { scoreFor, FORTY_FIVE } from "../../lib/forty-five/config.ts";
import { statsFrom } from "../../lib/forty-five/stats.ts";
import { nextResetAt, puzzleNumber, utcToday } from "../../lib/forty-five/dates.ts";
import { scheduleOrder } from "../../lib/forty-five/schedule.ts";
import fs from "node:fs";
import type { SourcePuzzle } from "../../lib/forty-five/format.ts";

let passed = 0, failed = 0;
const ok = (c: boolean, n: string) => (c ? passed++ : (failed++, console.log(`FAIL ${n}`)));

const groups: Group[] = [
  { difficulty: 1, label: "A", words: ["a1", "a2", "a3", "a4"], explanation: "" },
  { difficulty: 2, label: "B", words: ["b1", "b2", "b3", "b4"], explanation: "" },
  { difficulty: 3, label: "C", words: ["c1", "c2", "c3", "c4"], explanation: "" },
  { difficulty: 4, label: "D", words: ["d1", "d2", "d3", "d4"], explanation: "" },
];
const s0 = emptyState();
const e1 = evaluate(groups, s0, ["A1", "a2", "a3", "a4"]);
ok(e1.ok && e1.result === "correct" && e1.group?.difficulty === 1, "correct, case-insensitive");
const e2 = evaluate(groups, s0, ["a1", "a2", "a3", "b1"]);
ok(e2.ok && e2.result === "one_away", "3 of 4 is one away");
const e3 = evaluate(groups, s0, ["a1", "a2", "b1", "b2"]);
ok(e3.ok && e3.result === "wrong", "2+2 is wrong");
ok(!evaluate(groups, s0, ["a1", "a1", "a2", "a3"]).ok, "duplicate words invalid");
ok(!evaluate(groups, s0, ["a1", "a2", "a3", "zz"]).ok, "unknown word invalid");
ok(!evaluate(groups, s0, ["a1", "a2", "a3"]).ok, "3 words invalid");

let s = apply(s0, ["a1", "a2", "b1", "b2"], e3 as never);
const rep = evaluate(groups, s, ["b2", "b1", "a2", "a1"]);
ok(!rep.ok && rep.reason === "repeat", "repeat guess (any order) isn't counted");
s = apply(s, ["a1", "a2", "a3", "a4"], e1 as never);
ok(!evaluate(groups, s, ["a1", "b1", "c1", "d1"]).ok, "solved words can't be guessed again");

// Win with 1 mistake → 41
const won = replay(groups, [["a1", "a2", "b1", "b2"], ["a1", "a2", "a3", "a4"], ["b1", "b2", "b3", "b4"], ["c1", "c2", "c3", "c4"], ["d1", "d2", "d3", "d4"]]);
ok(won.finished && won.won && won.score === 41 && won.mistakes === 1, "win with one mistake scores 41");
ok(replay(groups, [["a1", "a2", "a3", "a4"], ["b1", "b2", "b3", "b4"], ["c1", "c2", "c3", "c4"], ["d1", "d2", "d3", "d4"]]).score === 45, "perfect game scores 45");
// Loss after finding 1 group → 5
const lost = replay(groups, [["a1", "a2", "a3", "a4"], ["b1", "c1", "d1", "b2"], ["b1", "c1", "d1", "b3"], ["b1", "c1", "d1", "b4"], ["c1", "b2", "d2", "c2"], ["d1", "d2", "d3", "d4"]]);
ok(lost.finished && !lost.won && lost.score === 5 && lost.guesses.length === 5, "4 mistakes ends the game; loss = 5 × groups found; later guesses ignored");
ok(scoreFor(true, 3, 4) === 33 && scoreFor(false, 4, 3) === 15 && scoreFor(false, 4, 0) === 0, "scoring table");
ok(FORTY_FIVE.maxMistakes === 4, "config");

const sh1 = shuffledWords(groups, "puzzle-1"), sh2 = shuffledWords(groups, "puzzle-1"), sh3 = shuffledWords(groups, "puzzle-2");
ok(sh1.join() === sh2.join() && sh1.join() !== sh3.join() && new Set(sh1).size === 16, "shuffle is stable per puzzle");
ok(sh1.join() !== groups.flatMap((g) => g.words).join(), "shuffle doesn't leave groups in order");
const grid = shareGrid(groups, won.guesses, { 1: "🟩", 2: "🟧", 3: "🟦", 4: "🟥" });
ok(grid.split("\n")[0] === "🟩🟩🟧🟧" && grid.split("\n").length === 5 && !/[a-d]\d/.test(grid), "share grid: tiers only, no words");

// Stats
const g = (date: string, score: number, won = true) => ({ date, score, won });
const st = statsFrom([g("2026-11-10", 45), g("2026-11-11", 41), g("2026-11-12", 5, false), g("2026-11-13", 45), g("2026-11-14", 37), g("2026-11-15", 41)], "2026-11-16");
ok(st.streak === 3 && st.maxStreak === 3 && st.played === 6 && st.wins === 5, `streak continues from yesterday (${st.streak}/${st.maxStreak})`);
ok(statsFrom([g("2026-11-10", 45)], "2026-11-12").streak === 0, "a missed day breaks the streak");
ok(statsFrom([g("2026-11-10", 45), g("2026-11-11", 45)], "2026-11-11").streak === 2, "today counts");
ok(st.distribution[0].score === 45 && st.distribution[0].count === 2 && st.average === 35.7, "distribution and average");

ok(puzzleNumber("2026-11-10") === 1 && puzzleNumber("2026-11-21") === 12, "puzzle numbers");
ok(nextResetAt(new Date("2026-11-10T23:59:00Z")).toISOString() === "2026-11-11T00:00:00.000Z" && utcToday(new Date("2026-11-10T23:59:59Z")) === "2026-11-10", "UTC rollover");

// Schedule order on the real bank: d-001 first, the new batch next, 80% Mixed finals while they last.
const bank: SourcePuzzle[] = fs.readdirSync("content/forty-five/daily").flatMap((f) => JSON.parse(fs.readFileSync(`content/forty-five/daily/${f}`, "utf8")));
const order = scheduleOrder(bank.map((p) => ({ slug: p.slug, mixedFinal: p.groups.some((g) => g.difficulty === 4 && g.subject === "Mixed") })));
ok(order[0].slug === "d-001" && order[1].slug === "d-091" && order.length === bank.length, `opener then newest batch (${order.slice(0, 3).map((o) => o.slug)})`);
const first50 = order.slice(0, 50).filter((o) => o.mixedFinal).length;
ok(first50 >= 39 && first50 <= 41, `about 80% Mixed finals early on (${first50}/50)`);
const runEnd = order.findLastIndex((o) => o.mixedFinal) + 1;
console.log(`schedule: ${order.filter((o) => o.mixedFinal).length} Mixed finals; 80% mix lasts ${runEnd} days`);
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
