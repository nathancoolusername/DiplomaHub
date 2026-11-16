import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Suggestion } from "@/lib/data/types";
import { suggestionHref } from "@/lib/practice/links";

/**
 * The line under Home's greeting: the top suggestion in a few big words,
 * with its button. Pro students get Bro's wording (cached with the brief);
 * everyone else gets the suggestion's own short headline.
 */
export function HomeNudge({ suggestion, broLine }: { suggestion: Suggestion | undefined; broLine: string | null }) {
  const text = broLine ?? suggestion?.headline;
  if (!suggestion || !text) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline gap-x-md gap-y-xs mt-sm">
      <p className="font-serif text-headline-sm md:text-headline-md text-on-surface-variant leading-snug">{text}</p>
      {suggestion.action && (
        <Link
          href={suggestionHref(suggestion.action)}
          className="self-start inline-flex items-center gap-xs text-label-lg font-semibold text-primary hover:underline whitespace-nowrap"
        >
          {suggestion.actionLabel ?? "Let's go"} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
