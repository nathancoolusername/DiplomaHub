import { getHubStats, parseRange } from "@/app/lib/admin-stats";
import { subjectById } from "@/lib/catalog";
import { LineChart } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";
import { CHART_1, CHART_2, CHART_3, Empty, PageHeader, Panel, RangeSelect, StatCard, StatGrid, StatsError, percent } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ range?: string }> };

const KIND_LABELS: Record<string, string> = { deadline: "Deadline", test: "Test", mock: "Mock", study: "Study", "(none)": "No kind (older items)" };
const TYPE_LABELS: Record<string, string> = {
  ib_component: "IB assessment",
  task: "Personal task",
  study_block: "Study block",
  university: "University deadline",
};
// Catalog names ("english_b" → "English B"); students' own subjects arrive as one "custom:" row.
const subjectLabel = (id: string) => (id === "custom:" ? "Own subjects" : (subjectById(id)?.name ?? id));

const relabel = (rows: { label: string; count: number }[], map: Record<string, string>) => rows.map((r) => ({ label: map[r.label] ?? r.label, value: r.count }));

export default async function AdminHubPage({ searchParams }: Props) {
  const range = parseRange((await searchParams).range);
  const result = await getHubStats(range);
  const header = <PageHeader title="Hub" description="Who set up the Hub and how they use it." right={<RangeSelect basePath="/admin/hub" range={range} />} />;
  if (!result.ok) {
    return (
      <>
        {header}
        <StatsError error={result.error} />
      </>
    );
  }
  const h = result.data;

  return (
    <>
      {header}
      <StatGrid>
        <StatCard accent label="Hub set up" value={h.onboarded} hint={`${percent(h.onboarded, h.total_users)} of ${h.total_users.toLocaleString()} users`} />
        <StatCard label="Added an item" value={h.users_with_items} hint={`${percent(h.users_with_items, h.onboarded)} of those set up`} />
        <StatCard label="Returning Hub users" value={h.returning_users} hint="Hub activity on 2+ different days" />
        <StatCard label="Items in total" value={h.total_items} hint={`${h.items_window.toLocaleString()} in the last ${range} days`} />
      </StatGrid>
      <StatGrid>
        <StatCard label="With a Home countdown" value={h.with_timer} />
        <StatCard label="Opening a practice set" value={h.with_practice_set} hint="Scheduled from Practice" />
        <StatCard label="Imported (calendar)" value={h.imported} />
        <StatCard label="Study sessions logged" value={h.study_sessions} />
      </StatGrid>

      <Panel title="Hub over time" description={`New Hub setups and items added, last ${range} days`}>
        <LineChart
          series={[
            { key: "setups", label: "Hub setups", color: CHART_1, data: h.series.map((d) => ({ date: d.date, count: d.setups })) },
            { key: "items", label: "Items added", color: CHART_3, data: h.series.map((d) => ({ date: d.date, count: d.items })) },
          ]}
        />
      </Panel>

      <div className="grid lg:grid-cols-2 gap-md">
        <Panel title="Items by type">{h.by_type.length ? <BarChart color={CHART_2} data={relabel(h.by_type, TYPE_LABELS)} /> : <Empty>No items yet.</Empty>}</Panel>
        <Panel title="Items by kind" description="What students say each item is">
          {h.by_kind.length ? <BarChart color={CHART_1} data={relabel(h.by_kind, KIND_LABELS)} /> : <Empty>No items yet.</Empty>}
        </Panel>
        <Panel title="Subjects picked" description="Students taking each subject, from the Hub or Practice (TOK, EE and CAS left out: everyone has them)">
          {(() => {
            // Before migration 27 the list still has the always-on core and one row per own subject.
            const rows = new Map<string, number>();
            for (const s of h.top_subjects) {
              if (["tok", "ee", "cas", "general"].includes(s.label)) continue;
              const label = subjectLabel(s.label.startsWith("custom:") ? "custom:" : s.label);
              rows.set(label, (rows.get(label) ?? 0) + s.count);
            }
            const data = [...rows].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
            return data.length ? <BarChart color={CHART_3} data={data} /> : <Empty>No subjects yet.</Empty>;
          })()}
        </Panel>
        <Panel title="Exam sessions" description="Which session students are sitting">
          {h.exam_sessions.length ? <BarChart color={CHART_2} data={relabel(h.exam_sessions, {})} /> : <Empty>Nobody has picked one yet.</Empty>}
        </Panel>
      </div>
    </>
  );
}
