import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getBroBrief, getMySquads, getViewer, getWeeklyReset } from "@/lib/data";
import { ResetFlow } from "@/components/reset/ResetFlow";
import { BroBriefCard } from "@/components/hub/pro/BroBriefCard";

export const metadata: Metadata = { title: "Sunday Reset", robots: { index: false } };

// The Sunday Reset (free): last week, this week, and three short sessions for
// the Hub, in ten minutes. Pro students also get Bro's brief on the week.
export default async function SundayResetPage() {
  if (!(await getCurrentUserId())) redirect("/login?next=/hub/reset");
  const [data, viewer, brief, squads] = await Promise.all([getWeeklyReset(), getViewer(), getBroBrief().catch(() => null), getMySquads()]);

  return (
    <div className="dh-page-bg bg-surface-container-low min-h-full">
      <div className="max-w-[860px] mx-auto px-md py-xl flex flex-col gap-lg">
        <header className="flex flex-col gap-xs">
          <p className="text-label-md font-bold uppercase tracking-[0.15em] text-primary">Sunday Reset</p>
          <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Ten minutes. A calm week after it.</h1>
          <p className="text-body-lg text-on-surface-variant">Look back, look ahead, and put a few short sessions where they count.</p>
        </header>
        <ResetFlow data={data} squads={squads.map((s) => ({ id: s.id, name: s.name }))} briefSlot={viewer.isPro && brief ? <BroBriefCard brief={brief} isPro /> : null} />
      </div>
    </div>
  );
}
