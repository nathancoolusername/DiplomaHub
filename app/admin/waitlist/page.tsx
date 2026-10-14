import { getWaitlistEntries, getWaitlistStats, parseRange } from "@/app/lib/admin-stats";
import { LineChart } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { WaitlistTable } from "@/components/admin/WaitlistTable";
import { CHART_1, CHART_2, CHART_3, Empty, PageHeader, Panel, RangeSelect, StatCard, StatGrid, StatsError, percent } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ range?: string }> };

export default async function AdminWaitlistPage({ searchParams }: Props) {
  const range = parseRange((await searchParams).range);
  const [result, entries] = await Promise.all([getWaitlistStats(range), getWaitlistEntries(100)]);
  const header = <PageHeader title="Waitlist" description="People who want DiplomaPro when it opens." right={<RangeSelect basePath="/admin/waitlist" range={range} />} />;
  if (!result.ok) {
    return (
      <>
        {header}
        <StatsError error={result.error} />
      </>
    );
  }
  const w = result.data;

  return (
    <>
      {header}
      <StatGrid>
        <StatCard accent label="On the waitlist" value={w.total} hint={`${percent(w.total, w.total_users)} of all users`} />
        <StatCard label="New today" value={w.new_1d} hint={`${w.new_7d.toLocaleString()} this week · ${w.new_30d.toLocaleString()} this month`} />
        <StatCard label="Signed-in students" value={w.signed_in} hint={`${percent(w.signed_in, w.total)} of the list`} />
        <StatCard label="Visitors (email only)" value={w.visitors} />
      </StatGrid>

      <Panel title="Sign-ups over time" description={`Last ${range} days`}>
        <LineChart series={[{ key: "waitlist", label: "Sign-ups", color: CHART_1, data: w.series }]} />
      </Panel>

      <div className="grid lg:grid-cols-2 gap-md">
        <Panel title="Where they joined" description="The page or button they came from">
          {w.by_source.length ? <BarChart color={CHART_3} data={w.by_source.map((r) => ({ label: r.label, value: r.count }))} /> : <Empty>No sign-ups yet.</Empty>}
        </Panel>
        <Panel title="What signed-in members study" description="Subjects of the students on the list">
          {w.subjects.length ? <BarChart color={CHART_2} data={w.subjects.map((r) => ({ label: r.label, value: r.count }))} /> : <Empty>No signed-in members yet.</Empty>}
        </Panel>
      </div>

      <Panel title="Emails">
        {entries.ok ? <WaitlistTable initial={entries.data} total={w.total} /> : <StatsError error={entries.error} />}
      </Panel>
    </>
  );
}
