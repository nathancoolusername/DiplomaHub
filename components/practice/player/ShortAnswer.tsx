"use client";

import { useState } from "react";
import { Eye, Lock } from "lucide-react";
import type { AttemptAnswer, Markscheme, Question } from "@/lib/data/types";
import { tickedMarks } from "@/lib/practice/marking";
import { MathMarkdown } from "@/components/shared/MathMarkdown";
import { ProGate } from "@/components/shared/ProUpsell";
import { Switch } from "@/components/shared/Switch";
import { MarkPointList } from "../MarkPointList";
import { partHeading } from "./question-format";

/**
 * Structured short answer: an optional box per part (or "on paper"), then
 * the markscheme as tick boxes that tally the marks.
 */
export function ShortAnswer({
  question,
  answer,
  markscheme,
  timed,
  isPro,
  revealing,
  onChange,
  onReveal,
}: {
  question: Question;
  answer: AttemptAnswer;
  markscheme: Markscheme | null;
  timed: boolean;
  isPro: boolean;
  revealing: boolean;
  onChange: (patch: Partial<AttemptAnswer>) => void;
  onReveal: () => void;
}) {
  const [showSolution, setShowSolution] = useState(false);
  const [broNote, setBroNote] = useState(false);
  const single = question.parts.length === 1;

  const toggleTick = (label: string, i: number) => {
    const current = answer.tickedPoints[label] ?? [];
    const next = current.includes(i) ? current.filter((x) => x !== i) : [...current, i].sort((a, b) => a - b);
    onChange({ tickedPoints: { ...answer.tickedPoints, [label]: next } });
  };

  return (
    <div className="flex flex-col gap-lg">
      <ol className="flex flex-col gap-lg">
        {question.parts.map((part) => (
          <li key={part.label} className="flex flex-col gap-sm">
            <div className="flex items-start gap-md">
              {!single && <span className="font-semibold text-on-surface shrink-0">{partHeading(part.label)}</span>}
              <div className="flex-1 text-body-lg text-on-surface min-w-0">
                <MathMarkdown>{part.textMd}</MathMarkdown>
              </div>
              <span className="shrink-0 font-semibold text-on-surface tabular-nums">[{part.marks}]</span>
            </div>
            {!answer.onPaper && (
              <textarea
                value={answer.partAnswers[part.label] ?? ""}
                onChange={(e) => onChange({ partAnswers: { ...answer.partAnswers, [part.label]: e.target.value } })}
                placeholder="Type your answer, or answer on paper"
                aria-label={`Answer ${single ? "" : partHeading(part.label)}`}
                rows={3}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-2 focus:outline-primary resize-y"
              />
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-md">
        <Switch checked={answer.onPaper} onChange={(onPaper) => onChange({ onPaper })} label="I'm answering on paper" />

        {timed ? (
          <span className="inline-flex items-center gap-xs text-label-md text-on-surface-variant">
            <Lock size={14} aria-hidden="true" /> Markschemes unlock when you finish the set
          </span>
        ) : (
          !markscheme && (
            <button
              type="button"
              onClick={onReveal}
              disabled={revealing}
              className="inline-flex items-center gap-xs rounded-lg border border-primary text-primary px-md py-xs text-label-md font-semibold hover:bg-primary-fixed cursor-pointer disabled:opacity-50"
            >
              <Eye size={14} aria-hidden="true" /> {revealing ? "Loading…" : "Show markscheme"}
            </button>
          )
        )}

        {!timed && (
          <ProGate
            isPro={isPro}
            feature="Answer checking"
            onClick={() => setBroNote(true)}
            className="rounded-lg px-md py-xs text-label-md font-semibold text-on-surface-variant hover:text-primary"
          >
            Have Bro check my answer
          </ProGate>
        )}
      </div>
      {broNote && (
        <p className="text-label-md text-on-surface-variant -mt-sm">Bro answer checks arrive with DiplomaBro (phase 7).</p>
      )}

      {markscheme && (
        <section className="rounded-xl border border-outline-variant bg-surface-container-low p-md flex flex-col gap-md" aria-label="Markscheme">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-on-surface">Markscheme</h3>
            <span className="text-label-md font-semibold text-on-surface tabular-nums">
              {tickedMarks(markscheme, answer.tickedPoints)} / {question.totalMarks}
            </span>
          </div>
          <p className="text-label-sm text-on-surface-variant -mt-sm">Tick each mark your working earns. Marks in brackets are implied by later correct work.</p>
          {markscheme.parts.map((part) => (
            <div key={part.label} className="flex flex-col gap-xs">
              {!single && <h4 className="text-label-md font-semibold text-on-surface-variant">{partHeading(part.label)}</h4>}
              <MarkPointList part={part} ticked={answer.tickedPoints[part.label] ?? []} onToggle={(i) => toggleTick(part.label, i)} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setShowSolution((s) => !s)}
            className="self-start text-label-md font-semibold text-primary hover:underline cursor-pointer"
          >
            {showSolution ? "Hide full solution" : "Show full solution"}
          </button>
          {showSolution && (
            <div className="text-body-md text-on-surface border-t border-outline-variant pt-sm">
              <MathMarkdown>{markscheme.workedSolutionMd}</MathMarkdown>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
