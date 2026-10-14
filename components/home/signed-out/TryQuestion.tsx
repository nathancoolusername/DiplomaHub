"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, RotateCcw } from "lucide-react";
import type { Markscheme, Question } from "@/lib/data/types";
import { Segmented } from "@/components/shared/Segmented";
import { tickedMarks } from "@/lib/practice/marking";
import { MathMarkdown } from "@/components/shared/MathMarkdown";
import { MarkPointList } from "@/components/practice/MarkPointList";
import { partHeading } from "@/components/practice/player/question-format";

type Sample = { subjectLabel: string; question: Question; markscheme: Markscheme };

/**
 * A few sample questions from different subjects that anyone can try:
 * answer (or do it on paper), open the markscheme, tick the marks you
 * earned. Nothing is saved.
 */
export function TryQuestion({ samples }: { samples: Sample[] }) {
  const [index, setIndex] = useState(0);
  const current = samples[index];
  return (
    <section id="try-a-question" className="bg-surface-container-lowest px-md py-16 scroll-mt-16" aria-labelledby="try-heading">
      <div className="max-w-[900px] mx-auto flex flex-col gap-lg">
        <header className="flex flex-col items-center gap-sm text-center">
          <h2 id="try-heading" className="font-serif font-bold text-headline-lg text-on-surface">
            Try one now
          </h2>
          <p className="text-body-lg text-on-surface-variant">Pick a subject, work it out, then mark yourself the way an examiner would.</p>
          <Segmented
            label="Subject"
            value={String(index)}
            onChange={(v) => setIndex(Number(v))}
            options={samples.map((s, i) => ({ value: String(i), label: s.subjectLabel }))}
          />
        </header>
        {/* Keyed so switching subject starts fresh. */}
        <SampleQuestionCard key={current.question.id} subjectLabel={current.subjectLabel} question={current.question} markscheme={current.markscheme} />
        <p className="text-center text-label-sm text-on-surface-variant">
          Questions are written for DiplomaHub in the style of IB papers. DiplomaHub is not affiliated with the International Baccalaureate.
        </p>
      </div>
    </section>
  );
}

function SampleQuestionCard({ subjectLabel, question, markscheme }: Sample) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [ticks, setTicks] = useState<Record<string, number[]>>({});

  const toggle = (label: string, i: number) =>
    setTicks((t) => {
      const cur = t[label] ?? [];
      return { ...t, [label]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] };
    });
  const earned = tickedMarks(markscheme, ticks);
  const anyTicked = Object.values(ticks).some((t) => t.length > 0);

  return (
        <article className="rounded-2xl bg-surface-container-low border border-outline-variant p-lg md:p-xl flex flex-col gap-lg">
          <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
            <span>{subjectLabel} · Paper {question.paper.slice(1)} · {question.calculator ? "Calculator" : "No calculator"}</span>
            <span className="tabular-nums">[{question.totalMarks} marks]</span>
          </div>
          <div className="text-body-lg text-on-surface">
            <MathMarkdown>{question.stemMd}</MathMarkdown>
          </div>

          <ol className="flex flex-col gap-lg">
            {question.parts.map((part) => {
              const ms = markscheme.parts.find((p) => p.label === part.label);
              return (
                <li key={part.label} className="flex flex-col gap-sm">
                  <div className="flex items-start gap-md text-body-lg text-on-surface">
                    <span className="font-semibold">{partHeading(part.label)}</span>
                    <div className="flex-1 min-w-0">
                      <MathMarkdown>{part.textMd}</MathMarkdown>
                    </div>
                    <span className="font-semibold tabular-nums">[{part.marks}]</span>
                  </div>
                  {!revealed && (
                    <textarea
                      value={answers[part.label] ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [part.label]: e.target.value }))}
                      rows={2}
                      placeholder="Your working (optional, or use paper)"
                      aria-label={`Answer ${partHeading(part.label)}`}
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md text-on-surface placeholder:text-on-surface-variant resize-y"
                    />
                  )}
                  {revealed && ms && (
                    <div className="rounded-xl bg-surface-container-lowest border border-outline-variant p-sm flex flex-col gap-xs">
                      {answers[part.label]?.trim() && (
                        <p className="px-sm text-label-md text-on-surface-variant whitespace-pre-wrap">
                          You wrote: <span className="text-on-surface">{answers[part.label]}</span>
                        </p>
                      )}
                      <MarkPointList part={ms} ticked={ticks[part.label] ?? []} onToggle={(i) => toggle(part.label, i)} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {!revealed ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="self-start inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-lg py-sm font-semibold hover:bg-primary/90 cursor-pointer"
            >
              <Eye size={16} aria-hidden="true" /> Show the markscheme
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-md border-t border-outline-variant pt-md">
              <p className="text-body-lg text-on-surface" aria-live="polite">
                {anyTicked ? (
                  <>
                    You scored <span className="font-bold tabular-nums">{earned} / {question.totalMarks}</span>.
                  </>
                ) : (
                  "Tick each mark your working earns."
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setRevealed(false);
                  setTicks({});
                  setAnswers({});
                }}
                className="inline-flex items-center gap-xs text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer"
              >
                <RotateCcw size={14} aria-hidden="true" /> Start again
              </button>
              <Link href="/signup" className="ml-auto rounded-lg bg-primary text-on-primary px-lg py-sm font-semibold hover:bg-primary/90">
                Get a full set, free
              </Link>
            </div>
          )}
        </article>
  );
}
