import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { SquadStart } from "@/components/squads/SquadStart";

export const metadata: Metadata = { title: "Join a squad", robots: { index: false } };

// The invite link: /squads/join/ABC234. Signed out → log in first (the link is
// kept). Signed in → the Join form with the code filled in: joining is always
// a tap, never just opening a link.
export default async function JoinSquadPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  if (!(await getCurrentUserId())) redirect(`/login?next=/squads/join/${clean}`);

  return (
    <div className="dh-page-bg bg-surface-container-low min-h-full">
      <div className="max-w-[860px] mx-auto px-md py-xl flex flex-col gap-lg">
        <header className="flex flex-col gap-xs">
          <p className="text-label-md font-bold uppercase tracking-[0.15em] text-primary">Squads</p>
          <h1 className="font-serif font-bold text-headline-lg text-on-surface">A friend invited you to their squad</h1>
          <p className="text-body-lg text-on-surface-variant">
            Squad members see your name, your weekly practice points, marks won back, whether you&apos;ve planned your week and which topics you
            practised. Never your grades or results.
          </p>
        </header>
        <SquadStart first initialCode={clean} />
      </div>
    </div>
  );
}
