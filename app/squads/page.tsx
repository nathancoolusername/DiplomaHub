import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Crown, Users } from "lucide-react";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getMySquads } from "@/lib/data";
import { SquadStart } from "@/components/squads/SquadStart";

export const metadata: Metadata = { title: "Squads", robots: { index: false } };

// Squads (free): small friend groups with a weekly board. Create one or join
// with a friend's code.
export default async function SquadsPage() {
  if (!(await getCurrentUserId())) redirect("/login?next=/squads");
  const squads = await getMySquads();

  return (
    <div className="dh-page-bg bg-surface-container-low min-h-full">
      <div className="max-w-[860px] mx-auto px-md py-xl flex flex-col gap-lg">
        <header className="flex flex-col gap-xs">
          <p className="text-label-md font-bold uppercase tracking-[0.15em] text-primary">Squads</p>
          <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Revise with your friends, not just next to them.</h1>
          <p className="text-body-lg text-on-surface-variant">
            A weekly board for up to 15 friends: practice points, marks won back and who&apos;s planned their week. Grades and results stay private.
          </p>
        </header>

        {squads.length > 0 && (
          <ul className="flex flex-col gap-sm">
            {squads.map((s) => (
              <li key={s.id}>
                <Link href={`/squads/${s.id}`} className="group flex items-center gap-md rounded-2xl bg-surface-container-lowest border border-outline-variant px-lg py-md hover:border-primary">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-primary text-on-primary flex items-center justify-center" aria-hidden="true">
                    <Users size={18} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-body-lg text-on-surface truncate group-hover:text-primary">{s.name}</span>
                    <span className="flex items-center gap-xs text-label-md text-on-surface-variant">
                      {s.members} member{s.members === 1 ? "" : "s"}
                      {s.isOwner && (
                        <>
                          · <Crown size={12} aria-hidden="true" /> you made it
                        </>
                      )}
                    </span>
                  </span>
                  <ChevronRight size={18} className="text-on-surface-variant" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <SquadStart first={squads.length === 0} />
      </div>
    </div>
  );
}
