"use client";

import { useEffect, useState } from "react";
import { CalendarDays, RotateCcw, Sparkles, TrendingUp } from "lucide-react";

export type DemoSubject = { id: string; name: string };

const WHEN = [
  { label: "In 3 days", days: 3 },
  { label: "In a week", days: 7 },
  { label: "In 2 weeks", days: 14 },
  { label: "In a month", days: 30 },
];
const DAY = 86_400_000;
const STAGES = 5; // 0 empty · 1 test lands · 2 lost marks · 3 sessions placed · 4 marks recovered
const STAGE_MS = 1700;
// Sample results: three past tests, then the one the system just prepared you for.
const RESULTS = [
  { label: "Sept", pct: 52, grade: 4 },
  { label: "Oct", pct: 58, grade: 5 },
  { label: "Nov", pct: 61, grade: 5 },
  { label: "Next", pct: 74, grade: 6 },
];
const GAIN = RESULTS[3].pct - RESULTS[2].pct;

/**
 * The hero: the system running on one test. It plays on its own (a sample
 * Physics test), and re-runs with the visitor's own test when they pick one.
 */
export function SystemDemo({ subjects }: { subjects: DemoSubject[] }) {
  const [subjectId, setSubjectId] = useState("physics");
  const [days, setDays] = useState(7);
  const [run, setRun] = useState(0); // bumps to restart the animation
  const [stage, setStage] = useState(0);
  const [mine, setMine] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const id = setTimeout(() => setStage(STAGES - 1), 0);
      return () => clearTimeout(id);
    }
    let s = 0;
    const tick = setInterval(() => {
      s = s + 1;
      // Hold on the last stage for a beat, then replay (only while it's the sample).
      if (s >= STAGES + 2) {
        if (mine) return clearInterval(tick);
        s = 0;
      }
      setStage(Math.min(s, STAGES - 1));
    }, STAGE_MS);
    return () => clearInterval(tick);
  }, [run, mine]);

  const subject = subjects.find((s) => s.id === subjectId) ?? subjects[0];
  const pick = (patch: { subjectId?: string; days?: number }) => {
    if (patch.subjectId) setSubjectId(patch.subjectId);
    if (patch.days) setDays(patch.days);
    setMine(true);
    setStage(0);
    setRun((r) => r + 1);
  };

  return (
    <div className="flex flex-col gap-md">
      {/* B: the system, playing. Keyed so a new test starts from a clean board. */}
      <Board
        key={run}
        subject={subject}
        days={days}
        stage={stage}
        onReplay={() => {
          setStage(0);
          setRun((r) => r + 1);
        }}
        // C: the one question, as a sentence to fill in.
        question={
          <p className="text-body-lg text-on-surface leading-relaxed">
            My next test is{" "}
            <select
              value={subjectId}
              onChange={(e) => pick({ subjectId: e.target.value })}
              aria-label="Subject"
              className="field-sizing-content font-semibold text-primary bg-transparent border-b-2 border-primary/40 hover:border-primary cursor-pointer pr-xs"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>{" "}
            <select
              value={days}
              onChange={(e) => pick({ days: Number(e.target.value) })}
              aria-label="When"
              className="field-sizing-content font-semibold text-primary bg-transparent border-b-2 border-primary/40 hover:border-primary cursor-pointer pr-xs"
            >
              {WHEN.map((w) => (
                <option key={w.days} value={w.days}>
                  {w.label.toLowerCase()}
                </option>
              ))}
            </select>
          </p>
        }
      />
    </div>
  );
}

function Board({
  subject,
  days,
  stage,
  onReplay,
  question,
}: {
  subject: DemoSubject;
  days: number;
  stage: number;
  onReplay: () => void;
  question: React.ReactNode;
}) {
  // The week ending on the test (or from today, if it's sooner).
  const [today] = useState(() => new Date(new Date().setHours(0, 0, 0, 0)).getTime());
  const test = today + days * DAY;
  const start = Math.max(today, test - 7 * DAY);
  const strip = Array.from({ length: Math.round((test - start) / DAY) + 1 }, (_, i) => start + i * DAY);
  const before = strip.slice(0, -1);
  // Up to three sessions, spread over the days before the test.
  const picks = before.length <= 3 ? before : [before[0], before[Math.floor(before.length / 2)], before[before.length - 1]];
  const mins = [25, 20, 30];
  const earlier = days > 7 ? Math.round((days - 7) / 7) * 2 : 0;

  const wk = (t: number) => new Date(t).toLocaleDateString("en-GB", { weekday: "short" });
  const show = (n: number) => `transition-all duration-500 ${stage >= n ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`;

  return (
    <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-xl p-lg flex flex-col gap-md">
      <div className="flex items-start justify-between gap-sm">
        {question}
        <span className="flex items-center gap-xs shrink-0">
          <span className="rounded-full bg-surface-container px-sm py-px text-label-sm text-on-surface-variant">Sample</span>
          <button type="button" onClick={onReplay} aria-label="Replay" title="Replay" className="p-xs rounded-lg text-on-surface-variant hover:text-primary cursor-pointer">
            <RotateCcw size={14} aria-hidden="true" />
          </button>
        </span>
      </div>

      {/* 1 + 3: the week, the test landing, sessions slotting in. */}
      <div className="flex flex-col gap-xs">
        <div className="flex items-center gap-xs text-label-sm font-semibold text-on-surface">
          <CalendarDays size={14} className="text-primary" aria-hidden="true" /> Plan
          {earlier > 0 && <span className={`font-normal text-on-surface-variant ${show(3)}`}>· plus {earlier} short sessions in the weeks before</span>}
        </div>
        <div className="grid gap-xs" style={{ gridTemplateColumns: `repeat(${strip.length}, minmax(0, 1fr))` }}>
          {strip.map((d) => {
            const isTest = d === test;
            const s = picks.indexOf(d);
            return (
              <div key={d} className="flex flex-col gap-xs min-w-0">
                <span className={`text-center text-label-sm ${d === today ? "font-bold text-primary" : "text-on-surface-variant"}`}>{d === today ? "Today" : wk(d)}</span>
                <div className="h-20 rounded-xl bg-surface-container-low p-[3px] flex flex-col justify-end">
                  {isTest && (
                    <div className={`rounded-lg bg-on-surface text-surface px-xs py-xs text-[0.68rem] font-bold leading-tight ${show(1)}`}>
                      {subject.name.split(" ")[0]} test
                    </div>
                  )}
                  {s >= 0 && (
                    <div
                      className={`rounded-lg bg-primary text-on-primary px-xs py-xs text-[0.68rem] font-semibold leading-tight ${show(3)}`}
                      style={{ transitionDelay: stage >= 3 ? `${s * 150}ms` : "0ms" }}
                    >
                      {mins[s]} min
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2 + 4, the headline: results going up. */}
      <div className={`flex flex-col gap-xs ${show(2)}`}>
        <div className="flex items-center justify-between text-label-sm font-semibold text-on-surface">
          <span className="flex items-center gap-xs">
            <TrendingUp size={14} className="text-primary" aria-hidden="true" /> Your {subject.name} results
          </span>
          <span className="text-on-surface-variant font-normal">logged on Progress</span>
        </div>
        <div className="flex items-end gap-sm h-24 px-xs">
          {RESULTS.map((r, i) => {
            const isNew = i === RESULTS.length - 1;
            const pct = isNew && stage < 4 ? 0 : r.pct;
            return (
              <div key={r.label} className="flex-1 flex flex-col items-center justify-end gap-px h-full">
                <span className={`text-label-sm font-bold tabular-nums ${isNew ? "text-primary" : "text-on-surface-variant"} ${isNew ? show(4) : ""}`}>
                  {r.pct}% · {r.grade}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-1000 ${isNew ? "bg-primary" : "bg-primary/30"}`}
                  style={{ height: `${pct}%` }}
                />
                <span className="text-label-sm text-on-surface-variant whitespace-nowrap">{isNew ? (stage >= 4 ? "This test" : "?") : r.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`rounded-2xl bg-primary-fixed text-on-primary-fixed px-md py-sm flex items-center gap-md ${show(4)}`}>
        <p className="font-serif font-bold text-[2rem] leading-none tabular-nums">+{GAIN}%</p>
        <p className="flex-1 text-body-md font-semibold">
          Grade {RESULTS[RESULTS.length - 2].grade} → {RESULTS[RESULTS.length - 1].grade}, your best {subject.name} result yet
        </p>
        <Sparkles size={18} aria-hidden="true" />
      </div>
    </div>
  );
}
