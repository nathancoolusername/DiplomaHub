import { RotateCcw } from "lucide-react";
import type { MarksWonBack } from "@/lib/data";

/** Progress: marks won back from practice (migration 51). Hidden until there's something to show. */
export function MarksWonBackCard({ data }: { data: MarksWonBack | null }) {
  if (!data || (data.wonTotal === 0 && data.open === 0)) return null;
  const topics = data.bySubtopic.filter((t) => t.open > 0).slice(0, 4);
  return (
    <section aria-labelledby="won-back" className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md">
      <h2 id="won-back" className="font-serif font-bold text-headline-md text-on-surface flex items-center gap-sm">
        <RotateCcw size={20} className="text-primary" aria-hidden="true" /> Marks won back
      </h2>
      <div className="flex flex-wrap gap-sm">
        <Stat value={data.wonSince} label="this week" />
        <Stat value={data.wonTotal} label="in total" />
        <Stat value={data.open} label="still to win back" />
      </div>
      {topics.length > 0 && (
        <div className="flex flex-col gap-xs">
          <p className="text-label-md font-semibold text-on-surface">Where the open marks are</p>
          {topics.map((t) => (
            <div key={`${t.subjectId}:${t.subtopicCode}`} className="flex items-center gap-sm">
              <span className="flex-1 min-w-0 truncate text-body-md text-on-surface">
                {t.name} <span className="text-label-sm text-on-surface-variant">· {t.subjectName}</span>
              </span>
              <span className="text-label-md tabular-nums text-on-surface-variant">
                {t.won} won back · {t.open} open
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="text-label-sm text-on-surface-variant">
        A lost mark is won back when you later earn the same kind of mark (method, answer, reasoning…) on a different question of the same topic, at least as hard.
      </p>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-surface-container-low px-md py-sm">
      <p className="font-serif font-bold text-headline-md text-primary tabular-nums leading-none">{value}</p>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
    </div>
  );
}
