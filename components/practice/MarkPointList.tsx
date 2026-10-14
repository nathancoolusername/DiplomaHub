"use client";

import { Check } from "lucide-react";
import type { PartMarkscheme } from "@/lib/data/types";
import { partMarks } from "@/lib/practice/marking";
import { MathMarkdown } from "@/components/shared/MathMarkdown";

/**
 * A part's markscheme as tick boxes (M1, A1, R1 …). Implied marks show in
 * brackets, as on a real IB markscheme. Tallies the ticked marks.
 */
export function MarkPointList({
  part,
  ticked,
  onToggle,
  showAnswer = true,
}: {
  part: PartMarkscheme;
  ticked: number[];
  /** Omit for a read-only list. */
  onToggle?: (index: number) => void;
  showAnswer?: boolean;
}) {
  const possible = part.markPoints.reduce((s, p) => s + p.marks, 0);
  const earned = partMarks(part, ticked);

  return (
    <div className="flex flex-col gap-xs">
      <ul className="flex flex-col gap-xs">
        {part.markPoints.map((point, i) => {
          const on = ticked.includes(i);
          const code = point.implied ? `(${point.code})` : point.code;
          const row = (
            <>
              <span
                aria-hidden="true"
                className={`mt-0.5 w-5 h-5 shrink-0 rounded border flex items-center justify-center ${
                  on ? "bg-secondary border-secondary text-on-secondary" : "border-outline bg-surface-container-lowest"
                }`}
              >
                {on && <Check size={14} strokeWidth={3} />}
              </span>
              <span className="w-12 shrink-0 font-mono text-label-md font-bold text-primary tabular-nums">{code}</span>
              <span className="flex-1 text-body-md text-on-surface min-w-0">
                <MathMarkdown inline>{point.text}</MathMarkdown>
                {point.note && <span className="block text-label-sm text-on-surface-variant mt-0.5">{point.note}</span>}
              </span>
            </>
          );
          return (
            <li key={i}>
              {onToggle ? (
                <label className="flex items-start gap-sm rounded-lg px-sm py-xs hover:bg-surface-container cursor-pointer">
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => onToggle(i)} />
                  {row}
                </label>
              ) : (
                <div className="flex items-start gap-sm px-sm py-xs">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="flex items-center justify-between gap-md px-sm text-label-md">
        {showAnswer && part.answerMd ? (
          <span className="text-on-surface-variant">
            Answer: <MathMarkdown inline className="text-on-surface">{part.answerMd}</MathMarkdown>
          </span>
        ) : (
          <span />
        )}
        <span className="font-semibold text-on-surface tabular-nums" aria-live="polite">
          {earned} / {possible} {possible === 1 ? "mark" : "marks"}
        </span>
      </div>
    </div>
  );
}
