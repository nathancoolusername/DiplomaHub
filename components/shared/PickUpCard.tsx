import Link from "next/link";
import { History } from "lucide-react";
import type { RecentSession } from "@/lib/data/types";
import { links } from "@/lib/practice/links";
import { DiscardSetButton } from "./DiscardSetButton";

/** Unfinished sets, each with Resume or Delete (Hub and Practice). Finished sets never show here. */
export function PickUpCard({ sessions }: { sessions: RecentSession[] }) {
  return (
    <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md" aria-labelledby="pick-up">
      <h2 id="pick-up" className="font-serif font-bold text-body-lg text-on-surface flex items-center gap-sm">
        <History size={18} className="text-primary" aria-hidden="true" /> Pick up where you left off
      </h2>
      {sessions.length === 0 ? (
        <div className="flex flex-col items-start gap-sm">
          <p className="text-body-md text-on-surface-variant">Nothing unfinished. Sets you leave part-way through show up here.</p>
          <Link href={links.practice()} className="rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90">
            Practice
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-md">
          {sessions.map(({ attempt, set, answered, total }) => (
            <li key={attempt.id} className="flex items-center gap-md">
              <div className="flex-1 min-w-0 flex flex-col gap-xs">
                <div className="flex items-baseline justify-between gap-sm">
                  <p className="text-body-md font-semibold text-on-surface truncate">{set.title}</p>
                  <span className="shrink-0 text-label-sm text-on-surface-variant tabular-nums">
                    {answered} / {total}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full bg-surface-container overflow-hidden"
                  role="progressbar"
                  aria-label={`${set.title} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={total ? Math.round((answered / total) * 100) : 0}
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${total ? (answered / total) * 100 : 0}%` }} />
                </div>
              </div>
              <Link
                href={links.play(set.id)}
                className="shrink-0 w-20 text-center rounded-lg px-md py-xs text-label-md font-semibold bg-primary text-on-primary hover:bg-primary/90"
              >
                Resume
              </Link>
              <DiscardSetButton attemptId={attempt.id} title={set.title} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
