"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { editResult, logResult, removeResult } from "@/app/lib/actions/results";
import { chartGrade, describeResult, RESULT_KIND_LABEL, type StudentResult } from "@/lib/results";
import type { PastTest, PracticeSubject } from "@/lib/data/supabase/results";
import { GradeChart } from "./GradeChart";
import { PracticeChart } from "./PracticeChart";
import { boundariesFor, gradeFromPercent, type Bounds } from "@/lib/grade-boundaries";
import { BoundariesPanel } from "./BoundariesPanel";
import { ResultForm, type SubjectOption } from "./ResultForm";

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export type PracticeProgress = PracticeSubject & { name: string; href: string };

const pct = (score: number, max: number) => (max ? Math.round((score / max) * 100) : 0);

/**
 * /progress: "How did it go?" for past Hub tests, then Test results (totals
 * and one card per subject with its grade chart and results), then Practice
 * (each subject's score per week from the questions done on DiplomaHub).
 */
export function ProgressBoard({
  initial,
  subjects,
  testsToLog,
  practice,
  overrides: initialOverrides,
}: {
  initial: StudentResult[];
  subjects: SubjectOption[];
  testsToLog: PastTest[];
  practice: PracticeProgress[];
  /** The student's own boundaries per subject (their school's). */
  overrides: Record<string, Bounds>;
}) {
  const [overrides, setOverrides] = useState(initialOverrides);
  const [results, setResults] = useState(initial);
  const [pending, setPending] = useState(testsToLog);
  // The open form: a new result, a Hub test being logged, or one result being edited.
  const [form, setForm] = useState<{ type: "new" } | { type: "hub"; test: PastTest } | { type: "edit"; result: StudentResult } | null>(null);
  const names = useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);
  const bounds = (id: string) => boundariesFor(id, subjects.find((s) => s.id === id)?.level, overrides[id]);

  const bySubject = useMemo(() => {
    const m = new Map<string, StudentResult[]>();
    for (const r of results) m.set(r.subjectId, [...(m.get(r.subjectId) ?? []), r]);
    for (const list of m.values()) list.sort((a, b) => a.takenOn.localeCompare(b.takenOn));
    return m;
  }, [results]);

  // Latest graded result per subject, for the total.
  const latest = [...bySubject.entries()]
    .map(([id, list]) => {
      const graded = list.map((r) => ({ r, g: chartGrade(r, bounds(id)) })).filter((x) => x.g);
      return { id, last: graded[graded.length - 1] };
    })
    .filter((x) => x.last);
  const total = latest.reduce((n, x) => n + x.last!.g!.grade, 0);

  const save = async (input: Parameters<typeof logResult>[0]) => {
    if (form?.type === "edit") {
      const res = await editResult(form.result.id, input);
      if (!res.success) return res.error;
      setResults((all) => all.map((r) => (r.id === res.data.id ? res.data : r)));
    } else {
      const res = await logResult(input);
      if (!res.success) return res.error;
      setResults((all) => [...all, res.data]);
      if (form?.type === "hub") setPending((p) => p.filter((t) => t.hubItemId !== form.test.hubItemId));
    }
    setForm(null);
    return null;
  };

  const remove = async (r: StudentResult) => {
    if (!confirm(`Delete “${r.title}”?`)) return;
    const res = await removeResult(r.id);
    if (res.success) setResults((all) => all.filter((x) => x.id !== r.id));
  };

  if (subjects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-outline-variant px-md py-lg text-center text-body-md text-on-surface-variant">
        Pick your subjects in Practice first, then log your results here.
      </p>
    );
  }

  const formPanel = form && (
    <section className="rounded-2xl border border-primary bg-surface-container-lowest p-lg flex flex-col gap-sm">
      <h2 className="font-serif font-bold text-headline-sm text-on-surface">
        {form.type === "edit" ? "Edit result" : form.type === "hub" ? `How did “${form.test.title}” go?` : "Log a result"}
      </h2>
      <ResultForm
        key={form.type === "edit" ? form.result.id : form.type === "hub" ? form.test.hubItemId : "new"}
        subjects={subjects}
        initial={
          form.type === "edit"
            ? form.result
            : form.type === "hub"
              ? {
                  subjectId: form.test.subjectId && names.has(form.test.subjectId) ? form.test.subjectId : undefined,
                  title: form.test.title,
                  kind: form.test.kind,
                  takenOn: form.test.date,
                  hubItemId: form.test.hubItemId,
                }
              : undefined
        }
        submitLabel={form.type === "edit" ? "Save" : "Log result"}
        onSubmit={save}
        onCancel={() => setForm(null)}
      />
    </section>
  );

  return (
    <div className="flex flex-col gap-xl">
      {pending.length > 0 && (
        <section className="flex flex-col gap-sm" aria-label="Tests to log">
          {pending.map((t) => (
            <div key={t.hubItemId} className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-md py-sm flex flex-wrap items-center gap-sm">
              <p className="flex-1 min-w-0 text-body-md text-on-surface">
                <span className="font-semibold">How did it go?</span> {t.title}
                <span className="text-on-surface-variant">
                  {" "}
                  · {t.subjectId ? `${names.get(t.subjectId) ?? ""} · ` : ""}
                  {shortDate(t.date)}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setForm({ type: "hub", test: t })}
                className="rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold cursor-pointer"
              >
                Log result
              </button>
              <button
                type="button"
                onClick={() => setPending((p) => p.filter((x) => x.hubItemId !== t.hubItemId))}
                className="text-label-md text-on-surface-variant hover:text-primary cursor-pointer"
              >
                Not now
              </button>
            </div>
          ))}
        </section>
      )}

      <h2 className="font-serif font-bold text-headline-md text-on-surface -mb-md">Test results</h2>
      <div className="flex flex-wrap items-end justify-between gap-md">
        <div className="flex flex-wrap gap-md">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-lg py-md">
            <p className="text-label-md text-on-surface-variant">Latest grades added up</p>
            <p className="font-serif font-bold text-display-lg leading-none tabular-nums text-on-surface">
              {latest.length ? total : "–"}
              <span className="text-headline-sm text-on-surface-variant"> / {Math.max(latest.length, 1) * 7}</span>
            </p>
            <p className="text-label-sm text-on-surface-variant">
              {latest.length} of {subjects.length} subjects · TOK/EE points not included
            </p>
          </div>
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest px-lg py-md">
            <p className="text-label-md text-on-surface-variant">Results logged</p>
            <p className="font-serif font-bold text-display-lg leading-none tabular-nums text-on-surface">{results.length}</p>
          </div>
        </div>
        {!form && (
          <button
            type="button"
            onClick={() => setForm({ type: "new" })}
            className="inline-flex items-center gap-xs rounded-full bg-primary text-on-primary px-lg py-sm text-label-lg font-semibold cursor-pointer"
          >
            <Plus size={16} /> Log a result
          </button>
        )}
      </div>

      {formPanel}

      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant px-md py-lg text-center text-body-md text-on-surface-variant">
          No results yet. Log your last test or mock to start your chart. Grades, marks and percentages all work.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-lg">
          {subjects
            .filter((s) => bySubject.has(s.id))
            .map((s) => {
              const list = bySubject.get(s.id)!;
              const b = bounds(s.id);
              const graded = list.map((r) => chartGrade(r, b)).filter((g): g is NonNullable<typeof g> => g !== null);
              const last = graded[graded.length - 1];
              const prev = graded[graded.length - 2];
              const change = last && prev ? last.grade - prev.grade : null;
              return (
                <section key={s.id} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg flex flex-col gap-sm min-w-0">
                  <div className="flex items-start justify-between gap-sm">
                    <h2 className="font-serif font-bold text-headline-sm text-on-surface">{s.name}</h2>
                    {last && (
                      <div className="text-right">
                        <p className="font-serif font-bold text-headline-lg leading-none tabular-nums text-on-surface">
                          {last.estimated ? "≈" : ""}
                          {last.grade}
                        </p>
                        {change !== null && (
                          <p className="inline-flex items-center gap-0.5 text-label-sm text-on-surface-variant">
                            {change > 0 ? <ArrowUp size={12} aria-hidden="true" /> : change < 0 ? <ArrowDown size={12} aria-hidden="true" /> : <Minus size={12} aria-hidden="true" />}
                            {change > 0 ? `up ${change}` : change < 0 ? `down ${-change}` : "same"} since last
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <GradeChart results={list} boundaries={b} />
                  {graded.some((g) => g.estimated) && (
                    <p className="text-label-sm text-on-surface-variant">
                      Hollow dots are estimates from your percentage, using {b.custom ? "your school's boundaries" : `the ${b.source} ${s.level ?? "SL"} boundaries`} (see Grade boundaries below).
                    </p>
                  )}
                  <ul className="flex flex-col divide-y divide-outline-variant border-t border-outline-variant">
                    {[...list].reverse().map((r) => (
                      <li key={r.id} className="flex items-center gap-sm py-xs">
                        <div className="flex-1 min-w-0">
                          <p className="text-body-md text-on-surface truncate">{r.title}</p>
                          <p className="text-label-sm text-on-surface-variant">
                            {RESULT_KIND_LABEL[r.kind]} · {shortDate(r.takenOn)}
                            {r.source === "bro" ? " · logged by Bro" : ""}
                          </p>
                        </div>
                        <p className="text-body-md text-on-surface tabular-nums text-right">{describeResult(r)}</p>
                        <button type="button" onClick={() => setForm({ type: "edit", result: r })} aria-label={`Edit ${r.title}`} className="p-xs text-on-surface-variant hover:text-primary cursor-pointer">
                          <Pencil size={14} />
                        </button>
                        <button type="button" onClick={() => void remove(r)} aria-label={`Delete ${r.title}`} className="p-xs text-on-surface-variant hover:text-error cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
        </div>
      )}

      <section className="flex flex-col gap-md" aria-labelledby="practice-heading">
        <div>
          <h2 id="practice-heading" className="font-serif font-bold text-headline-md text-on-surface">
            Practice
          </h2>
          <p className="text-body-md text-on-surface-variant">Your score on DiplomaHub practice questions, week by week (marked questions, last 6 months).</p>
        </div>
        {practice.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant px-md py-lg text-center text-body-md text-on-surface-variant">
            No marked practice yet. Finish a set in Practice and your scores show up here.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-lg">
            {practice.map((p) => {
              const head = p.last30 ?? p.total;
              const prevWeek = p.weeks[p.weeks.length - 2];
              const lastWeek = p.weeks[p.weeks.length - 1];
              const change = prevWeek && lastWeek ? pct(lastWeek.score, lastWeek.max) - pct(prevWeek.score, prevWeek.max) : null;
              return (
                <section key={p.subjectId} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg flex flex-col gap-sm min-w-0">
                  <div className="flex items-start justify-between gap-sm">
                    <div>
                      <h3 className="font-serif font-bold text-headline-sm text-on-surface">{p.name}</h3>
                      <p className="text-label-sm text-on-surface-variant">
                        {p.total.questions} questions · {pct(p.total.score, p.total.max)}% overall
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif font-bold text-headline-lg leading-none tabular-nums text-on-surface">{pct(head.score, head.max)}%</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {p.last30 ? "last 30 days" : "overall"} · ≈ grade {gradeFromPercent(pct(head.score, head.max), bounds(p.subjectId))}
                      </p>
                      {change !== null && (
                        <p className="inline-flex items-center gap-0.5 text-label-sm text-on-surface-variant">
                          {change > 0 ? <ArrowUp size={12} aria-hidden="true" /> : change < 0 ? <ArrowDown size={12} aria-hidden="true" /> : <Minus size={12} aria-hidden="true" />}
                          {change > 0 ? `up ${change}` : change < 0 ? `down ${-change}` : "same"} on the week before
                        </p>
                      )}
                    </div>
                  </div>
                  <PracticeChart weeks={p.weeks} />
                  <a href={p.href} className="self-start text-label-md font-semibold text-primary hover:underline">
                    Practise {p.name} →
                  </a>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <BoundariesPanel
        subjects={subjects}
        overrides={overrides}
        onChange={(id, b) =>
          setOverrides((o) => {
            const next = { ...o };
            if (b) next[id] = b;
            else delete next[id];
            return next;
          })
        }
      />
    </div>
  );
}
