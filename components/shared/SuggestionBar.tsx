import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import type { Suggestion } from "@/lib/data/types";
import { suggestionHref } from "@/lib/practice/links";
import { BroAvatar } from "./BroAvatar";

/**
 * A full-width suggestion strip, sitting under a page's heading. Same data
 * as SuggestionCard; the "why" chips show what it's reacting to.
 */
export function SuggestionBar({ suggestion }: { suggestion: Suggestion }) {
  const fromBro = suggestion.source === "bro";
  return (
    <div className="rounded-2xl bg-surface-container-lowest px-lg py-md flex flex-wrap md:flex-nowrap items-center gap-md">
      {fromBro ? (
        <BroAvatar size={36} />
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 items-center justify-center rounded-[50%] bg-secondary-container text-on-secondary-container w-9 h-9"
        >
          <Lightbulb size={18} />
        </span>
      )}
      <div className="flex-1 min-w-0 flex flex-col gap-xs">
        <p className="text-body-md text-on-surface">{suggestion.text}</p>
        {suggestion.reasons && suggestion.reasons.length > 0 && (
          <ul className="flex flex-wrap gap-xs" aria-label="Why this suggestion">
            {suggestion.reasons.map((r) => (
              <li key={r} className="rounded-full bg-surface-container px-sm py-px text-label-sm text-on-surface-variant">
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>
      {suggestion.action && (
        <Link
          href={suggestionHref(suggestion.action)}
          className="shrink-0 inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90"
        >
          {suggestion.actionLabel} <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
