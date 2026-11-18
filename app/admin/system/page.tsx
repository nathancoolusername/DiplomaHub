import { getSystemStats, parseRange } from "@/app/lib/admin-stats";
import { BarChart } from "@/components/admin/charts/BarChart";
import { CHART_1, CHART_2, CHART_3, Empty, PageHeader, Panel, RangeSelect, StatCard, StatGrid, StatsError, percent } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ range?: string }> };

const ACCENT_NAMES: Record<string, string> = { sage: "Sage", tide: "Tide", orchid: "Orchid", blossom: "Blossom", ember: "Ember" };
const BACKDROP_NAMES: Record<string, string> = { dawn: "Dawn", aurora: "Aurora", dusk: "Dusk" };
const bars = (rows: { label: string; count: number }[], names: Record<string, string> = {}) => rows.map((r) => ({ label: names[r.label] ?? r.label, value: r.count }));

// The system features: Sunday Reset, Squads and their shelf, and how students style the site.
export default async function AdminSystemPage({ searchParams }: Props) {
  const range = parseRange((await searchParams).range);
  const result = await getSystemStats(range);
  const header = (
    <PageHeader title="System" description="Sunday Reset, Squads, the squad shelf, and accent colours." right={<RangeSelect basePath="/admin/system" range={range} />} />
  );
  if (!result.ok)
    return (
      <>
        {header}
        <StatsError error={result.error} />
      </>
    );
  const { resets, squads, shelf, appearance, missing } = result.data;

  return (
    <>
      {header}
      {missing.length > 0 && <StatsError error={`Not set up yet: ${missing.join(", ")} (a migration from 50–55 hasn't run).`} />}

      <h2 className="font-serif font-bold text-headline-md text-on-surface">Sunday Reset</h2>
      <StatGrid>
        <StatCard accent label="Resets done" value={resets.total} hint={`${resets.window.toLocaleString()} in the last ${range} days`} />
        <StatCard label="Students who've done one" value={resets.students} hint={`${resets.studentsWindow.toLocaleString()} in the last ${range} days`} />
        <StatCard label="Sessions per Reset" value={resets.avgSessions ?? "–"} hint="Added to the Hub, on average" />
        <StatCard label="Weeks tracked" value={resets.byWeek.length} hint="Most recent 8 shown below" />
      </StatGrid>
      <Panel title="Resets per week" description="By the Monday of the week planned">
        {resets.byWeek.length ? <BarChart data={bars(resets.byWeek)} color={CHART_1} /> : <Empty>No Resets yet.</Empty>}
      </Panel>

      <h2 className="font-serif font-bold text-headline-md text-on-surface pt-md">Squads</h2>
      <StatGrid>
        <StatCard accent label="Squads" value={squads.total} hint={`${squads.window.toLocaleString()} new in the last ${range} days`} />
        <StatCard label="Students in a squad" value={squads.inASquad} hint={`${squads.members.toLocaleString()} memberships`} />
        <StatCard label="Average size" value={squads.avgSize ?? "–"} hint={`Largest: ${squads.largest} · just one person: ${squads.solo}`} />
        <StatCard label={`Joins in ${range} days`} value={squads.joinsWindow} hint={squads.total ? `${percent(squads.total - squads.solo, squads.total)} of squads have friends in them` : undefined} />
      </StatGrid>

      <div className="grid lg:grid-cols-2 gap-md">
        <Panel title="The shelf" description={`${shelf.total.toLocaleString()} things shared · ${shelf.window.toLocaleString()} in the last ${range} days`}>
          {shelf.byType.length ? <BarChart data={bars(shelf.byType)} color={CHART_2} /> : <Empty>Nothing shared to a squad yet.</Empty>}
          <p className="text-label-md text-on-surface-variant pt-sm">
            Shelf codes have been added <span className="font-semibold text-on-surface">{shelf.adds.toLocaleString()}</span> times (from the shelf or anywhere else).
          </p>
        </Panel>
        <Panel title="Accent colours and backgrounds" description="Students who picked something other than IB Blue and Plain">
          {appearance.accents.some((a) => a.count) || appearance.backdrops.some((b) => b.count) ? (
            <div className="flex flex-col gap-md">
              <BarChart data={bars(appearance.accents, ACCENT_NAMES)} color={CHART_3} />
              <BarChart data={bars(appearance.backdrops, BACKDROP_NAMES)} color={CHART_1} />
            </div>
          ) : (
            <Empty>Nobody has changed their style yet.</Empty>
          )}
          <p className="text-label-md text-on-surface-variant pt-sm">
            &ldquo;Make it yours&rdquo; tip closed by <span className="font-semibold text-on-surface">{appearance.styleTipSeen.toLocaleString()}</span> students ·
            homepage waitlist signups: <span className="font-semibold text-on-surface">{appearance.homepageWaitlist.toLocaleString()}</span>
          </p>
        </Panel>
      </div>
    </>
  );
}
