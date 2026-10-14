import type { Suggestion } from "@/lib/data/types";
import { SuggestionCard } from "@/components/shared/SuggestionCard";
import { suggestionGridCols } from "@/components/shared/suggestion-grid";

/** Hub's "Next steps for today": a full-width row of suggestions with action buttons. */
export function NextStepsRow({ suggestions }: { suggestions: Suggestion[] }) {
  if (suggestions.length === 0) return null;
  return (
    <section className="flex flex-col gap-sm" aria-labelledby="next-steps">
      <h2 id="next-steps" className="font-serif font-bold text-body-lg text-on-surface">
        Next steps for today
      </h2>
      <div className={`grid gap-md items-stretch ${suggestionGridCols(suggestions.length)}`}>
        {suggestions.map((s) => (
          <SuggestionCard key={s.id} suggestion={s} compact actionStyle="button" tone="tinted" />
        ))}
      </div>
    </section>
  );
}
