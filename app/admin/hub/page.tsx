import { getHubStats, parseRange } from "@/app/lib/admin-stats";
import { SUBJECTS } from "@/components/hub/mock-data";
import { isCoreSubject } from "@/components/hub/onboarding/subject-cap";
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
// The Hub's own names ("math_aa" → "Math AA"); custom subjects show as "Own subject".
const HUB_SUBJECT_NAMES: Record<string, string> = Object.fromEntries(SUBJECTS.map((s) => [s.id, s.name]));
const subjectLabel = (id: string) => HUB_SUBJECT_NAMES[id] ?? (id.startsWith("custom:") ? "Own subject" : id);

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
        <Panel title="Subjects picked in the Hub" description="Students who picked each subject (TOK, EE, CAS and General left out: everyone has them)">
          {(() => {
            // TOK, EE, CAS and General are on for everyone, so they'd only crowd out the real choices.
            const picked = h.top_subjects.filter((s) => !isCoreSubject(s.label));
            const own = picked.filter((s) => s.label.startsWith("custom:")).reduce((n, s) => n + s.count, 0);
            const rows = [
              ...picked.filter((s) => !s.label.startsWith("custom:")).map((s) => ({ label: subjectLabel(s.label), value: s.count })),
              ...(own ? [{ label: "Own subjects", value: own }] : []),
            ].sort((a, b) => b.value - a.value);
            return rows.length ? <BarChart color={CHART_3} data={rows} /> : <Empty>No subjects yet.</Empty>;
          })()}
        </Panel>
        <Panel title="Exam sessions" description="Which session students are sitting">
          {h.exam_sessions.length ? <BarChart color={CHART_2} data={relabel(h.exam_sessions, {})} /> : <Empty>Nobody has picked one yet.</Empty>}
        </Panel>
      </div>
    </>
  );
}
