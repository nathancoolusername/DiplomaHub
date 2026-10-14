import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import type { PastSet } from "@/lib/data/types";
import { subjectById } from "@/lib/catalog";
import { links } from "@/lib/practice/links";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Finished sets with their score and a link back to the results (subject page and Practice). */
export function PastSets({ sets, showSubject = false, note }: { sets: PastSet[]; showSubject?: boolean; note?: string }) {
  return (
    <section className="flex flex-col gap-md" aria-labelledby="past-sets">
      <div className="flex items-end justify-between gap-md flex-wrap">
        <h2 id="past-sets" className="font-serif font-bold text-headline-md text-on-surface">
          Past sets
        </h2>
        {note && <p className="text-label-md text-on-surface-variant">{note}</p>}
      </div>
      <ul className="rounded-2xl bg-surface-container-lowest border border-outline-variant divide-y divide-outline-variant">
        {sets.map(({ attempt, set, scorePct }) => {
          const marking = attempt.status === "marking";
          const when = attempt.finishedAt ?? attempt.startedAt;
          return (
            <li key={attempt.id} className="flex items-center gap-md px-lg py-md">
              <ClipboardCheck size={18} className="shrink-0 text-on-surface-variant" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-semibold text-on-surface truncate">{set.title}</p>
                <p className="text-label-sm text-on-surface-variant">
                  {showSubject && `${subjectById(set.subjectId)?.shortName ?? set.subjectId} · `}
                  <time dateTime={when}>{dateFmt.format(new Date(when))}</time>
                </p>
              </div>
              <span className="shrink-0 text-label-md font-semibold tabular-nums text-on-surface">
                {marking ? <span className="text-on-surface-variant font-normal">Not marked</span> : scorePct !== null ? `${scorePct}%` : ""}
              </span>
              <Link
                href={links.attempt(attempt.id)}
                className="shrink-0 rounded-lg border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface hover:border-primary"
              >
                {marking ? "Mark" : "Results"}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
