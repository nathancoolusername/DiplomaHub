import type { McqOption } from "@/lib/data/types";
import { MathMarkdown } from "@/components/shared/MathMarkdown";

/** A marked multiple-choice question: every option, the right one and the student's pick. */
export function McqReview({ options, selected, correct }: { options: McqOption[]; selected: string | null; correct: string | null }) {
  return (
    <div className="flex flex-col gap-xs">
      <ul className="grid gap-xs">
        {options.map((o) => {
          const isCorrect = o.key === correct;
          const isWrongPick = o.key === selected && !isCorrect;
          return (
            <li
              key={o.key}
              className={`flex items-center gap-sm rounded-lg border px-md py-xs ${
                isCorrect
                  ? "border-secondary bg-secondary-container text-on-secondary-container"
                  : isWrongPick
                    ? "border-tertiary bg-tertiary-container text-on-tertiary-container"
                    : "border-outline-variant text-on-surface"
              }`}
            >
              <span className="w-6 h-6 shrink-0 rounded-[50%] bg-current/10 flex items-center justify-center text-label-sm font-bold">{o.key}</span>
              <span className="flex-1 min-w-0 text-body-md">
                <MathMarkdown inline>{o.textMd}</MathMarkdown>
              </span>
              {isCorrect && <span className="text-label-sm font-bold">{o.key === selected ? "Your answer, correct" : "Correct answer"}</span>}
              {isWrongPick && <span className="text-label-sm font-bold">Your answer</span>}
            </li>
          );
        })}
      </ul>
      {!selected && <p className="text-label-md text-on-surface-variant">You didn&apos;t pick an answer.</p>}
    </div>
  );
}
