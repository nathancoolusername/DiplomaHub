"use client";

import { Flag } from "lucide-react";

export type DotState = "answered" | "flagged" | "unanswered";

const DOT_STYLE: Record<DotState, string> = {
  answered: "bg-primary text-on-primary border-primary",
  flagged: "bg-surface-container-lowest text-tertiary border-tertiary border-2",
  unanswered: "bg-surface-container text-on-surface-variant border-outline-variant",
};

const DOT_LABEL: Record<DotState, string> = {
  answered: "answered",
  flagged: "flagged",
  unanswered: "unanswered",
};

/** One numbered dot per question: answered, flagged or unanswered. */
export function Navigator({
  states,
  current,
  onJump,
  layout,
}: {
  states: DotState[];
  current: number;
  onJump: (index: number) => void;
  layout: "rail" | "grid";
}) {
  return (
    <nav aria-label="Questions">
      <ol className={layout === "rail" ? "flex flex-col gap-sm items-center" : "grid grid-cols-6 gap-sm"}>
        {states.map((state, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onJump(i)}
              aria-current={i === current ? "step" : undefined}
              aria-label={`Question ${i + 1}, ${DOT_LABEL[state]}`}
              className={`relative w-9 h-9 rounded-[50%] border text-label-md font-semibold tabular-nums flex items-center justify-center cursor-pointer transition-shadow ${DOT_STYLE[state]} ${
                i === current ? "ring-2 ring-offset-2 ring-primary ring-offset-surface-container-low" : ""
              }`}
            >
              {i + 1}
              {state === "flagged" && <Flag size={10} className="absolute -top-1 -right-1 text-tertiary fill-current" aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ol>
      <ul className={`mt-md text-[11px] text-on-surface-variant flex gap-sm ${layout === "rail" ? "flex-col items-center" : "flex-wrap"}`}>
        {(Object.keys(DOT_STYLE) as DotState[]).map((s) => (
          <li key={s} className="flex items-center gap-1">
            <span className={`w-2.5 h-2.5 rounded-[50%] border ${DOT_STYLE[s]}`} aria-hidden="true" />
            {DOT_LABEL[s]}
          </li>
        ))}
      </ul>
    </nav>
  );
}
