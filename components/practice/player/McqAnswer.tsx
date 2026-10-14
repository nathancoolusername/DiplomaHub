"use client";

import type { Markscheme, McqOption } from "@/lib/data/types";
import { MathMarkdown } from "@/components/shared/MathMarkdown";

/**
 * Four option cards. With instant feedback (and a markscheme loaded), the
 * right answer turns teal and a wrong pick turns amber, and choices lock.
 */
export function McqAnswer({
  options,
  selected,
  markscheme,
  onSelect,
}: {
  options: McqOption[];
  selected: string | null;
  /** Present once feedback is showing. */
  markscheme: Markscheme | null;
  onSelect: (key: string) => void;
}) {
  const locked = markscheme !== null;
  const correct = markscheme?.correctOption ?? null;

  return (
    <div role="radiogroup" aria-label="Options" className="grid gap-sm">
      {options.map((option) => {
        const isSelected = selected === option.key;
        const isCorrect = locked && option.key === correct;
        const isWrongPick = locked && isSelected && option.key !== correct;
        const tone = isCorrect
          ? "border-secondary bg-secondary-container text-on-secondary-container"
          : isWrongPick
            ? "border-tertiary bg-tertiary-container text-on-tertiary-container"
            : isSelected
              ? "border-primary bg-primary-fixed text-on-primary-fixed"
              : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary";
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={locked}
            onClick={() => onSelect(option.key)}
            className={`flex items-center gap-md rounded-xl border-2 px-md py-sm text-left transition-colors cursor-pointer disabled:cursor-default ${tone}`}
          >
            <span
              className={`w-8 h-8 shrink-0 rounded-[50%] flex items-center justify-center font-bold text-label-md ${
                isSelected || isCorrect ? "bg-current/15" : "bg-surface-container"
              }`}
            >
              {option.key}
            </span>
            <span className="text-body-lg">
              <MathMarkdown inline>{option.textMd}</MathMarkdown>
            </span>
            {isCorrect && <span className="ml-auto text-label-sm font-bold">Correct answer</span>}
            {isWrongPick && <span className="ml-auto text-label-sm font-bold">Your answer</span>}
          </button>
        );
      })}
    </div>
  );
}
