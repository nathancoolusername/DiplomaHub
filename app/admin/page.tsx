import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAdminAnalytics, getAdminStats } from "@/app/lib/actions/admin";
import { getOverviewStats, parseRange } from "@/app/lib/admin-stats";
import { LineChart } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { CHART_1, CHART_2, CHART_3, PageHeader, Panel, RangeSelect, StatCard, StatGrid, StatsError, percent } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ range?: string }> };

// Overview: the user numbers in one place (not the list: that's Users).
export default async function AdminOverviewPage({ searchParams }: Props) {
  const range = parseRange((await searchParams).range);
  const [overview, statsResult, analyticsResult] = await Promise.all([getOverviewStats(range), getAdminStats(), getAdminAnalytics()]);

  const o = overview.ok ? overview.data : null;
  const newInRange = o ? o.series.reduce((sum, d) => sum + d.new, 0) : 0;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Everyone who has an account, who is using the site, and who keeps coming back."
        right={<RangeSelect basePath="/admin" range={range} />}
      />

      {!overview.ok && <StatsError error={overview.error} />}

      {o && (
        <>
          <StatGrid>
            <StatCard accent label="Total users" value={o.total_users} hint={`${o.pro_users.toLocaleString()} with Pro`} />
            <StatCard label={`New in ${range} days`} value={newInRange} hint={`${o.new_1d} today · ${o.new_7d} this week`} />
            <StatCard label="Active (7 days)" value={o.active_7d} hint={`${percent(o.active_7d, o.total_users)} of all users`} />
            <StatCard label="Returning (7 days)" value={o.returning_7d} hint="Active, and not just signed up" />
          </StatGrid>
          <StatGrid>
            <StatCard label="Active today" value={o.active_1d} />
            <StatCard label="Active (30 days)" value={o.active_30d} hint={`${percent(o.active_30d, o.total_users)} of all users`} />
            <StatCard label="Returning (30 days)" value={o.returning_30d} hint={`${percent(o.returning_30d, o.active_30d)} of the active`} />
            <StatCard label="Finished setup" value={percent(o.onboarded, o.total_users)} hint={`${o.onboarded.toLocaleString()} students`} />
          </StatGrid>

          <Panel
            title="Users over time"
            description={`New sign-ups, everyone active that day, and returning students (active on a day after they signed up). Last ${range} days.`}
          >
            <LineChart
              series={[
                { key: "new", label: "New", color: CHART_3, data: o.series.map((d) => ({ date: d.date, count: d.new })) },
                { key: "active", label: "Active", color: CHART_1, data: o.series.map((d) => ({ date: d.date, count: d.active })) },
                { key: "returning", label: "Returning", color: CHART_2, data: o.series.map((d) => ({ date: d.date, count: d.returning })) },
              ]}
            />
            <p className="text-label-sm text-on-surface-variant">
              Daily activity is recorded from the day this update went live. Before that, only each person&apos;s last visit is known, so earlier days show
              fewer active users than there really were.
            </p>
          </Panel>
        </>
      )}

      <div className="grid sm:grid-cols-3 gap-md">
        {[
          { href: "/admin/hub", title: "Hub", text: "Setups, items and countdowns" },
          { href: "/admin/practice", title: "Practice", text: "Sets, attempts and subject requests" },
          { href: "/admin/waitlist", title: "Waitlist", text: "Sign-ups for DiplomaPro" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg flex items-center justify-between gap-md hover:border-primary transition-colors"
          >
            <span className="flex flex-col">
              <span className="font-serif font-bold text-body-lg text-on-surface">{l.title}</span>
              <span className="text-label-md text-on-surface-variant">{l.text}</span>
            </span>
            <ArrowRight size={18} className="text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        ))}
      </div>

      {statsResult.success && analyticsResult.success && (
        <>
          <h2 className="font-serif font-bold text-headline-md text-on-surface pt-md">Library and community</h2>
          <StatGrid>
            <StatCard label="Resources" value={statsResult.data.totalResources} hint={`${statsResult.data.unpublishedResources} unpublished`} />
            <StatCard label="Articles" value={statsResult.data.totalArticles} hint={`${statsResult.data.unpublishedArticles} unpublished`} />
            <StatCard label="Downloads" value={analyticsResult.data.totalDownloads} />
            <StatCard label="Resource likes" value={analyticsResult.data.totalLikes} />
          </StatGrid>
          <div className="grid lg:grid-cols-2 gap-md">
            <Panel title="New content" description="Created in the last 30 days">
              <LineChart
                series={[
                  { key: "resources", label: "Resources", color: CHART_1, data: analyticsResult.data.newResources },
                  { key: "articles", label: "Articles", color: CHART_2, data: analyticsResult.data.newArticles },
                  { key: "discussions", label: "Discussions", color: CHART_3, data: analyticsResult.data.newDiscussions },
                ]}
              />
            </Panel>
            <Panel title="Most downloaded resources" description="Top 8">
              <BarChart color={CHART_1} data={analyticsResult.data.topResources.map((r) => ({ label: r.title, value: r.download_count }))} />
            </Panel>
            <Panel title="Resources by subject">
              <BarChart color={CHART_2} data={analyticsResult.data.resourcesBySubject.map((r) => ({ label: r.label, value: r.count }))} />
            </Panel>
            <Panel title="Resources by type">
              <BarChart color={CHART_3} data={analyticsResult.data.resourcesByType.map((r) => ({ label: r.label, value: r.count }))} />
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
