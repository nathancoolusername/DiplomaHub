"use client";

import { useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import type { AttemptAnswer, Question } from "@/lib/data/types";
import { PLAN_KEY } from "@/lib/practice/marking";
import { MathMarkdown } from "@/components/shared/MathMarkdown";
import { ProGate } from "@/components/shared/ProUpsell";
import { Switch } from "@/components/shared/Switch";

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/**
 * Extended response: a large editor with a word count, a collapsible
 * planning pad, and on-paper mode. Markbands appear after finishing.
 */
export function EssayAnswer({
  question,
  answer,
  isPro,
  onChange,
}: {
  question: Question;
  answer: AttemptAnswer;
  isPro: boolean;
  onChange: (patch: Partial<AttemptAnswer>) => void;
}) {
  const part = question.parts[0];
  const text = answer.partAnswers[part.label] ?? "";
  const plan = answer.partAnswers[PLAN_KEY] ?? "";
  const [planOpen, setPlanOpen] = useState(plan.length > 0);
  const [broNote, setBroNote] = useState(false);
  const setText = (key: string, value: string) => onChange({ partAnswers: { ...answer.partAnswers, [key]: value } });

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-start gap-md">
        <div className="flex-1 text-body-lg text-on-surface font-medium min-w-0">
          <MathMarkdown>{part.textMd}</MathMarkdown>
        </div>
        <span className="shrink-0 font-semibold text-on-surface tabular-nums">[{part.marks}]</span>
      </div>

      {/* Planning pad */}
      <div className="rounded-xl border border-outline-variant">
        <button
          type="button"
          onClick={() => setPlanOpen((o) => !o)}
          aria-expanded={planOpen}
          className="w-full flex items-center justify-between gap-sm px-md py-sm text-label-md font-semibold text-on-surface cursor-pointer"
        >
          Planning pad
          <span className="flex items-center gap-sm text-label-sm font-normal text-on-surface-variant">
            {!planOpen && plan.trim() && `${wordCount(plan)} words`}
            <ChevronDown size={16} className={`transition-transform ${planOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </span>
        </button>
        {planOpen && (
          <textarea
            value={plan}
            onChange={(e) => setText(PLAN_KEY, e.target.value)}
            rows={5}
            placeholder="Argument, key points, evidence and examples, counter-arguments, conclusion…"
            aria-label="Planning pad"
            className="w-full border-t border-outline-variant bg-surface-container-low px-md py-sm text-body-md text-on-surface placeholder:text-on-surface-variant resize-y rounded-b-xl focus:outline-2 focus:outline-primary"
          />
        )}
      </div>

      {/* Essay */}
      {!answer.onPaper && (
        <div className="flex flex-col gap-xs">
          <textarea
            value={text}
            onChange={(e) => setText(part.label, e.target.value)}
            rows={18}
            placeholder="Write your essay here…"
            aria-label="Your essay"
            className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-lg py-md text-body-lg leading-relaxed text-on-surface placeholder:text-on-surface-variant resize-y focus:outline-2 focus:outline-primary"
          />
          <p className="self-end text-label-sm text-on-surface-variant tabular-nums" aria-live="polite">
            {wordCount(text)} words
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-md">
        <Switch checked={answer.onPaper} onChange={(onPaper) => onChange({ onPaper })} label="I'm writing on paper" />
        <span className="inline-flex items-center gap-xs text-label-md text-on-surface-variant">
          <Lock size={14} aria-hidden="true" /> Markbands appear when you finish
        </span>
        <ProGate
          isPro={isPro}
          feature="Essay feedback"
          onClick={() => setBroNote(true)}
          className="rounded-lg px-md py-xs text-label-md font-semibold text-on-surface-variant hover:text-primary"
        >
          Have Bro review my essay
        </ProGate>
      </div>
      {broNote && <p className="text-label-md text-on-surface-variant -mt-sm">Bro essay reviews arrive with DiplomaBro (phase 7).</p>}
    </div>
  );
}
