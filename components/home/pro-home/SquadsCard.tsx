import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import type { SquadSummary } from "@/lib/data";

/** Squads on Home: your squads, or an invitation to start one. */
export function SquadsCard({ squads }: { squads: SquadSummary[] }) {
  if (squads.length === 0)
    return (
      <Link
        href="/squads"
        className="group rounded-2xl bg-surface-container-lowest border border-outline-variant px-lg py-md flex items-center gap-md hover:border-primary"
      >
        <span className="w-10 h-10 shrink-0 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center" aria-hidden="true">
          <Users size={18} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold text-on-surface group-hover:text-primary">Start a squad with your friends</span>
          <span className="block text-label-md text-on-surface-variant">A weekly board of practice points and marks won back. Grades stay private.</span>
        </span>
        <ChevronRight size={18} className="text-on-surface-variant" aria-hidden="true" />
      </Link>
    );

  return (
    <section aria-labelledby="home-squads" className="rounded-2xl bg-surface-container-lowest border border-outline-variant px-lg py-md flex flex-col gap-sm">
      <h2 id="home-squads" className="flex items-center gap-sm text-label-md font-semibold text-on-surface-variant">
        <Users size={16} className="text-primary" aria-hidden="true" /> Your squads
      </h2>
      <ul className="flex flex-wrap gap-sm">
        {squads.map((s) => (
          <li key={s.id}>
            <Link href={`/squads/${s.id}`} className="flex flex-col rounded-2xl border border-outline-variant px-md py-xs hover:border-primary group">
              <span className="text-label-md font-semibold text-on-surface group-hover:text-primary">{s.name}</span>
              <span className="text-label-sm text-on-surface-variant tabular-nums">
                {s.myRank && s.members > 1 ? `You're #${s.myRank} of ${s.members} this week` : `${s.members} member${s.members === 1 ? "" : "s"}`}
                {s.leader && !s.leaderIsMe ? ` · ${s.leader} leads` : ""}
              </span>
            </Link>
          </li>
        ))}
        <li className="self-center">
          <Link href="/squads" className="inline-flex items-center px-md py-xs text-label-md font-semibold text-primary hover:underline">
            See this week&apos;s boards
          </Link>
        </li>
      </ul>
    </section>
  );
}
