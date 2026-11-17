"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, RotateCcw } from "lucide-react";
import type { Markscheme, Question } from "@/lib/data/types";
import { tickedMarks } from "@/lib/practice/marking";
import { MathMarkdown } from "@/components/shared/MathMarkdown";
import { MarkPointList } from "@/components/practice/MarkPointList";
import { partHeading } from "@/components/practice/player/question-format";

export type CheckQuestion = { subjectLabel: string; topic: string; question: Question; markscheme: Markscheme };
export type CheckSubject = { id: string; label: string; questions: CheckQuestion[] };

/** Pick one of the subjects the bank covers, then its three questions. */
export function QuickCheckPicker({ subjects }: { subjects: CheckSubject[] }) {
  const [id, setId] = useState(subjects[0]?.id);
  const current = subjects.find((s) => s.id === id) ?? subjects[0];
  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap gap-xs justify-center" role="radiogroup" aria-label="Subject">
        {subjects.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={s.id === current.id}
            onClick={() => setId(s.id)}
            className={`rounded-full px-md py-xs text-label-md font-semibold border cursor-pointer ${
              s.id === current.id ? "bg-primary text-on-primary border-primary" : "border-outline-variant text-on-surface-variant hover:text-primary"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <QuickCheck key={current.id} questions={current.questions} />
    </div>
  );
}
type Ticks = Record<string, number[]>;

/**
 * The homepage hook: three questions, marked like the markscheme, then
 * exactly which marks you'd lose and on which topic. No account, nothing saved.
 */
export function QuickCheck({ questions }: { questions: CheckQuestion[] }) {
  const [i, setI] = useState(0);
  const [marking, setMarking] = useState(false);
  const [ticks, setTicks] = useState<Ticks[]>(() => questions.map(() => ({})));
  const [done, setDone] = useState(false);

  const restart = () => {
    setI(0);
    setMarking(false);
    setTicks(questions.map(() => ({})));
    setDone(false);
  };

  if (done) return <Summary questions={questions} ticks={ticks} onRestart={restart} />;

  const q = questions[i];
  const t = ticks[i];
  const toggle = (label: string, n: number) =>
    setTicks((all) =>
      all.map((x, j) => {
        if (j !== i) return x;
        const cur = x[label] ?? [];
        return { ...x, [label]: cur.includes(n) ? cur.filter((y) => y !== n) : [...cur, n] };
      }),
    );

  return (
    <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-xl p-lg flex flex-col gap-md">
      {/* Progress: three segments. */}
      <div className="flex items-center gap-sm">
        <div className="flex-1 flex gap-xs">
          {questions.map((_, j) => (
            <span key={j} className={`h-1.5 flex-1 rounded-full ${j < i || (j === i && marking) ? "bg-primary" : j === i ? "bg-primary/40" : "bg-surface-container-high"}`} />
          ))}
        </div>
        <span className="text-label-sm font-semibold text-on-surface-variant tabular-nums">
          {i + 1} of {questions.length}
        </span>
      </div>

      <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
        <span className="font-semibold text-on-surface">
          {q.subjectLabel} · {q.topic}
        </span>
        <span className="tabular-nums">[{q.question.totalMarks} marks]</span>
      </div>

      <div className="text-body-md text-on-surface">
        <MathMarkdown>{q.question.stemMd}</MathMarkdown>
      </div>

      <ol className="flex flex-col gap-md">
        {q.question.parts.map((part) => {
          const ms = q.markscheme.parts.find((p) => p.label === part.label);
          return (
            <li key={part.label} className="flex flex-col gap-xs">
              <div className="flex items-start gap-sm text-body-md text-on-surface">
                <span className="font-semibold">{partHeading(part.label)}</span>
                <div className="flex-1 min-w-0">
                  <MathMarkdown>{part.textMd}</MathMarkdown>
                </div>
                <span className="font-semibold tabular-nums">[{part.marks}]</span>
              </div>
              {!marking ? (
                <textarea
                  rows={2}
                  placeholder="Your working (or use paper)"
                  aria-label={`Answer ${partHeading(part.label)}`}
                  className="w-full rounded-xl border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface placeholder:text-on-surface-variant resize-y"
                />
              ) : (
                ms && (
                  <div className="rounded-xl bg-surface-container-low border border-outline-variant p-xs">
                    <MarkPointList part={ms} ticked={t[part.label] ?? []} onToggle={(n) => toggle(part.label, n)} />
                  </div>
                )
              )}
            </li>
          );
        })}
      </ol>

      {!marking ? (
        <button type="button" onClick={() => setMarking(true)} className="self-start inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-lg py-sm font-semibold hover:bg-primary/90 cursor-pointer">
          <Eye size={16} aria-hidden="true" /> Mark it
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-sm border-t border-outline-variant pt-sm">
          <p className="text-label-md text-on-surface-variant flex-1">Tick each mark your answer earns, like an examiner would.</p>
          <button
            type="button"
            onClick={() => {
              if (i + 1 < questions.length) {
                setI(i + 1);
                setMarking(false);
              } else setDone(true);
            }}
            className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-lg py-sm font-semibold hover:bg-primary/90 cursor-pointer"
          >
            {i + 1 < questions.length ? "Next question" : "See where my marks went"} <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

function Summary({ questions, ticks, onRestart }: { questions: CheckQuestion[]; ticks: Ticks[]; onRestart: () => void }) {
  const rows = questions.map((q, j) => {
    const earned = tickedMarks(q.markscheme, ticks[j]);
    const missed = q.markscheme.parts.flatMap((p) => p.markPoints.filter((_, n) => !(ticks[j][p.label] ?? []).includes(n)));
    return { q, earned, lost: q.question.totalMarks - earned, missed };
  });
  const total = rows.reduce((s, r) => s + r.q.question.totalMarks, 0);
  const lost = rows.reduce((s, r) => s + r.lost, 0);

  return (
    <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant shadow-xl p-lg flex flex-col gap-md">
      <div>
        <p className="text-label-md font-bold uppercase tracking-[0.15em] text-primary">Where your marks went</p>
        <p className="font-serif font-bold text-headline-lg text-on-surface">
          {lost === 0 ? "Full marks. Annoyingly good." : `You'd lose ${lost} of ${total} marks.`}
        </p>
      </div>
      <ul className="flex flex-col gap-sm">
        {rows.map((r) => (
          <li key={r.q.question.id} className="rounded-2xl bg-surface-container-low p-sm flex flex-col gap-xs">
            <div className="flex items-center justify-between gap-sm">
              <span className="text-body-md font-semibold text-on-surface">
                {r.q.subjectLabel} · {r.q.topic}
              </span>
              <span className={`rounded-full px-sm py-px text-label-sm font-bold tabular-nums ${r.lost === 0 ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container-high text-on-surface"}`}>
                {r.lost === 0 ? "All earned" : `−${r.lost}`}
              </span>
            </div>
            {r.missed.slice(0, 2).map((m, n) => (
              <div key={n} className="flex gap-xs text-label-md text-on-surface-variant">
                <span className="font-mono font-semibold text-on-surface shrink-0">{m.code}</span>
                <div className="min-w-0 line-clamp-2">
                  <MathMarkdown>{m.text}</MathMarkdown>
                </div>
              </div>
            ))}
          </li>
        ))}
      </ul>
      {lost > 0 && (
        <p className="text-body-md text-on-surface">
          Sign up free and practise exactly these topics. Every set is marked like this, and shows you where the marks went.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-sm">
        <Link href="/signup" className="rounded-lg bg-primary text-on-primary px-lg py-sm font-semibold hover:bg-primary/90">
          Practise these topics, free
        </Link>
        <button type="button" onClick={onRestart} className="ml-auto inline-flex items-center gap-xs text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer">
          <RotateCcw size={14} aria-hidden="true" /> Again
        </button>
      </div>
    </div>
  );
}
