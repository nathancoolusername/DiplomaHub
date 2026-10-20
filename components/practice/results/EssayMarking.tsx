"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { AttemptAnswer, EssayCriterion } from "@/lib/data/types";
import { PLAN_KEY } from "@/lib/practice/marking";
import { MathMarkdown } from "@/components/shared/MathMarkdown";

/**
 * Marking an essay: for each criterion, read the bands and pick the mark
 * that fits (best-fit, like an examiner). Read-only when `onChange` is omitted.
 */
export function EssayMarking({
  criteria,
  answer,
  chosen,
  onChange,
  feedbackPoints,
  planMd,
}: {
  criteria: EssayCriterion[];
  answer: AttemptAnswer;
  chosen: Record<string, number>;
  onChange?: (criterion: string, mark: number) => void;
  /** Tailored points for this prompt: what a strong answer does, shown while marking. */
  feedbackPoints?: string[] | null;
  planMd?: string;
}) {
  const essay = answer.partAnswers.whole?.trim();
  const plan = answer.partAnswers[PLAN_KEY]?.trim();
  const [showEssay, setShowEssay] = useState(true);

  return (
    <div className="flex flex-col gap-md">
      <div className="rounded-xl bg-surface-container-low border border-outline-variant">
        <button
          type="button"
          onClick={() => setShowEssay((s) => !s)}
          aria-expanded={showEssay}
          className="w-full flex items-center justify-between px-md py-sm text-label-md font-semibold text-on-surface cursor-pointer"
        >
          Your essay {essay ? `(${essay.split(/\s+/).length} words)` : ""}
          <ChevronDown size={16} className={`transition-transform ${showEssay ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {showEssay && (
          <div className="px-md pb-md border-t border-outline-variant pt-sm max-h-80 overflow-y-auto">
            {essay ? (
              <p className="whitespace-pre-wrap text-body-md text-on-surface leading-relaxed">{essay}</p>
            ) : (
              <p className="text-body-md text-on-surface-variant italic">{answer.onPaper ? "Written on paper" : "No essay written"}</p>
            )}
            {plan && (
              <details className="mt-sm">
                <summary className="text-label-sm text-on-surface-variant cursor-pointer">Your plan</summary>
                <p className="mt-xs whitespace-pre-wrap text-label-md text-on-surface-variant">{plan}</p>
              </details>
            )}
          </div>
        )}
      </div>

      {feedbackPoints && feedbackPoints.length > 0 && (
        <div className="rounded-xl bg-surface-container-low border border-outline-variant p-md flex flex-col gap-xs">
          <p className="text-label-md font-semibold text-on-surface">What a strong answer to this prompt does</p>
          <ul className="list-disc pl-lg flex flex-col gap-0.5 text-body-md text-on-surface">
            {feedbackPoints.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {planMd && (
            <details className="mt-xs">
              <summary className="text-label-md text-on-surface-variant cursor-pointer">Suggested plan</summary>
              <div className="mt-xs text-body-md text-on-surface">
                <MathMarkdown>{planMd}</MathMarkdown>
              </div>
            </details>
          )}
        </div>
      )}

      {criteria.map((c) => {
        const mark = chosen[c.name];
        return (
          <section key={c.name} className="flex flex-col gap-xs" aria-label={c.name}>
            <div className="flex items-baseline justify-between gap-sm">
              <h4 className="text-label-md font-semibold text-on-surface">{c.name}</h4>
              <span className="text-label-md font-semibold tabular-nums text-on-surface">
                {mark ?? "–"} / {c.maxMarks}
              </span>
            </div>
            <ul className="flex flex-col gap-xs">
              {[{ min: 0, max: 0, descriptor: "Does not reach the standard of the first band." }, ...c.bands].map((band) => {
                const inBand = mark !== undefined && mark >= band.min && mark <= band.max;
                const marks = Array.from({ length: band.max - band.min + 1 }, (_, i) => band.min + i);
                return (
                  <li
                    key={band.min}
                    className={`rounded-lg border px-md py-sm flex flex-wrap items-center gap-sm ${
                      inBand ? "border-primary bg-primary-fixed" : "border-outline-variant"
                    }`}
                  >
                    <span className="flex-1 min-w-48 text-label-md text-on-surface">{band.descriptor}</span>
                    <span className="flex gap-xs" role={onChange ? "radiogroup" : undefined} aria-label={`${c.name}, ${band.min}–${band.max}`}>
                      {marks.map((m) =>
                        onChange ? (
                          <button
                            key={m}
                            type="button"
                            role="radio"
                            aria-checked={mark === m}
                            onClick={() => onChange(c.name, m)}
                            className={`w-8 h-8 rounded-[50%] text-label-md font-semibold tabular-nums cursor-pointer ${
                              mark === m ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-high"
                            }`}
                          >
                            {m}
                          </button>
                        ) : (
                          <span
                            key={m}
                            className={`w-8 h-8 rounded-[50%] text-label-md font-semibold tabular-nums flex items-center justify-center ${
                              mark === m ? "bg-primary text-on-primary" : "text-on-surface-variant"
                            }`}
                          >
                            {m}
                          </span>
                        ),
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
