import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getOverviewStats, getPracticeStats, getRunningLow, getWaitlistStats } from "@/app/lib/admin-stats";

/**
 * Admin's own strip at the top of Home: today's numbers and a way into Admin.
 * Only rendered for the admin (app/dashboard/page.tsx); if the stats can't be
 * read (migration 19 not run yet) the button still shows.
 */
export async function AdminHomeBand() {
  const [overview, waitlist, practice, low] = await Promise.all([getOverviewStats(7), getWaitlistStats(7), getPracticeStats(7), getRunningLow()]);
  const stats = [
    overview.ok && { label: "Users", value: overview.data.total_users, hint: `${overview.data.new_1d} new today` },
    overview.ok && { label: "Active this week", value: overview.data.active_7d, hint: `${overview.data.returning_7d} returning` },
    waitlist.ok && { label: "Waitlist", value: waitlist.data.total, hint: `${waitlist.data.new_1d} new today` },
    practice.ok && { label: "Subject requests", value: practice.data.requests_total, hint: `${practice.data.requesters} students` },
    low.ok && { label: "Running low", value: low.data.students_low, hint: low.data.students_low === 1 ? "student near the end of a subject" : "students near the end of a subject" },
  ].filter((s): s is { label: string; value: number; hint: string } => !!s);

  return (
    <section aria-label="Admin" className="bg-surface-container-low px-md pt-md">
      <div className="max-w-[1600px] mx-auto w-full rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg flex flex-wrap items-center gap-lg">
        <div className="flex items-center gap-md">
          <span className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center" aria-hidden="true">
            <ShieldCheck size={22} />
          </span>
          <div>
            <p className="font-serif font-bold text-body-lg text-on-surface">Admin</p>
            <p className="text-label-md text-on-surface-variant">How DiplomaHub is doing</p>
          </div>
        </div>
        {stats.length > 0 && (
          <dl className="flex flex-wrap gap-x-xl gap-y-sm flex-1">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="text-label-sm text-on-surface-variant">{s.label}</dt>
                <dd className="font-serif font-bold text-headline-md text-on-surface tabular-nums leading-tight">{s.value.toLocaleString()}</dd>
                <dd className="text-label-sm text-on-surface-variant">{s.hint}</dd>
              </div>
            ))}
          </dl>
        )}
        <Link
          href="/admin"
          className="ml-auto inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-lg py-sm text-label-md font-bold hover:opacity-90"
        >
          Open Admin <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
