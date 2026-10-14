import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import type { Suggestion } from "@/lib/data/types";
import { suggestionHref } from "@/lib/practice/links";
import { BroAvatar } from "./BroAvatar";

/**
 * Free suggestions (rule-based) show a plain lightbulb; Pro suggestions
 * come from Bro and show his avatar. The link is always built from ids.
 */
export function SuggestionCard({
  suggestion,
  compact = false,
  actionStyle = "link",
  tone = "card",
}: {
  suggestion: Suggestion;
  compact?: boolean;
  /** "card": white card (for tinted pages). "tinted": light fill, for white pages like the Hub. */
  tone?: "card" | "tinted";
  /** "button": a filled action button (Hub's next steps); "link": a text link. */
  actionStyle?: "link" | "button";
}) {
  const fromBro = suggestion.source === "bro";
  return (
    <div
      className={`rounded-2xl flex gap-md items-start ${tone === "tinted" ? "bg-surface-container-low" : "bg-surface-container-lowest"} ${
        compact ? "p-md" : "p-lg"
      }`}
    >
      {fromBro ? (
        <BroAvatar size={compact ? 28 : 36} />
      ) : (
        <span
          aria-hidden="true"
          className="inline-flex shrink-0 items-center justify-center rounded-[50%] bg-secondary-container text-on-secondary-container w-9 h-9"
        >
          <Lightbulb size={18} />
        </span>
      )}
      <div className="flex flex-col gap-sm min-w-0 flex-1 h-full">
        <p className="text-body-md text-on-surface">{suggestion.text}</p>
        {suggestion.action && (
          <Link
            href={suggestionHref(suggestion.action)}
            className={
              actionStyle === "button"
                ? "self-start mt-auto inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90"
                : "self-start inline-flex items-center gap-xs text-label-md font-semibold text-primary hover:underline"
            }
          >
            {suggestion.actionLabel} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
