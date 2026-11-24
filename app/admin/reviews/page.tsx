import { getReviewAdminData } from "@/app/lib/actions/admin-reviews";
import { parseRange } from "@/app/lib/admin-stats";
import { estimateCost, formatDollars } from "@/lib/bro/pricing";
import { REVIEWS_PER_MONTH } from "@/lib/review/labels";
import { BarChart } from "@/components/admin/charts/BarChart";
import { CHART_1, Empty, PageHeader, Panel, RangeSelect, StatCard, StatGrid, StatsError, percent } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ range?: string }> };

const th = "px-md py-sm text-label-sm font-semibold text-on-surface-variant uppercase text-left";
const td = "px-md py-sm text-body-md text-on-surface tabular-nums";

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const mins = (s: number | null) => (s === null ? "–" : s < 60 ? `${Math.round(s)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`);

const STATUS: Record<string, string> = { uploading: "Upload unfinished", checked: "Checked, not reviewed", marking: "Reviewing", done: "Done", failed: "Failed" };

// Admin → Reviews: coursework reviews (IA, EE, TOK). Usage, cost, timing and
// who uses up the monthly allowance. Students' work stays private.
export default async function AdminReviewsPage({ searchParams }: Props) {
  const range = parseRange((await searchParams).range);
  const result = await getReviewAdminData(range);
  const header = (
    <PageHeader
      title="Reviews"
      description="Coursework reviews: how many, for what, what they cost and how long they take. Only counts and totals; students' work and reports stay private."
      right={<RangeSelect basePath="/admin/reviews" range={range} />}
    />
  );
  if (!result.success) {
    return (
      <>
        {header}
        <StatsError error={result.error} />
      </>
    );
  }
  const { window: w, month: m, total, byType, recent } = result.data;
  const costWindow = estimateCost(w.tokens);
  const costMonth = estimateCost(m.tokens);
  const perReview = w.done ? costWindow / w.done : 0;

  return (
    <>
      {header}
      <StatGrid>
        <StatCard accent label={`Reviews (${range} days)`} value={w.done} hint={`${w.students.toLocaleString()} students · ${total.reviews.toLocaleString()} ever`} />
        <StatCard label="Cost this month (estimate)" value={formatDollars(costMonth)} hint={`${formatDollars(costWindow)} in ${range} days · ${formatDollars(perReview)} a review`} />
        <StatCard label="Average time" value={mins(w.avgSeconds)} hint="From pressing Review to the report" />
        <StatCard label="Failed" value={w.failed} hint={w.started ? `${percent(w.failed, w.started)} of reviews started (refunded)` : "None started"} />
      </StatGrid>
      <StatGrid>
        <StatCard label="Uploads" value={w.uploads} hint={`${percent(w.started, w.uploads)} went on to a review`} />
        <StatCard label="Projects" value={total.projects} hint="All time" />
        <StatCard label="This month" value={m.reviews} hint={`${m.students.toLocaleString()} students · ${m.refunded.toLocaleString()} refunded`} />
        <StatCard label={`Used all ${REVIEWS_PER_MONTH}`} value={m.capHits.length} hint="Students at this month's limit" />
      </StatGrid>

      <div className="grid gap-lg lg:grid-cols-2">
        <Panel title="What's being reviewed" description={`Finished reviews in the last ${range} days, by subject and kind.`}>
          {byType.length ? <BarChart color={CHART_1} data={byType} /> : <Empty>No reviews yet.</Empty>}
        </Panel>
        <Panel title="At the monthly limit" description={`Students who used all ${REVIEWS_PER_MONTH} reviews this month.`}>
          {m.capHits.length ? (
            <ul className="flex flex-col gap-xs">
              {m.capHits.map((u) => (
                <li key={u.name + u.used} className="flex justify-between text-body-md text-on-surface">
                  <span>{u.name}</span>
                  <span className="tabular-nums text-on-surface-variant">{u.used}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nobody yet.</Empty>
          )}
        </Panel>
      </div>

      <Panel title="Latest drafts" description="The 25 most recent uploads. Cost includes the free check.">
        {recent.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className={th}>When</th>
                  <th className={th}>Student</th>
                  <th className={th}>Work</th>
                  <th className={th}>Status</th>
                  <th className={th}>Mark</th>
                  <th className={th}>Time</th>
                  <th className={th}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-outline-variant/50 last:border-0">
                    <td className={td}>{when(r.at)}</td>
                    <td className={td}>{r.name}</td>
                    <td className={td}>{r.work}</td>
                    <td className={td} title={r.error ?? undefined}>
                      {STATUS[r.status] ?? r.status}
                    </td>
                    <td className={td}>{r.mark ?? "–"}</td>
                    <td className={td}>{mins(r.seconds)}</td>
                    <td className={td}>{formatDollars(estimateCost([r.tokens]))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No uploads yet.</Empty>
        )}
      </Panel>
    </>
  );
}
