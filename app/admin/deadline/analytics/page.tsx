import { parseRange } from "@/app/lib/admin-stats";
import { getDeadlineAnalytics, getDeadlineWaiting } from "@/app/lib/admin-deadline-stats";
import { DeadlineAnalyticsView } from "@/components/admin/DeadlineAnalyticsView";
import { DeadlineTabs } from "@/components/admin/DeadlineTabs";
import { PageHeader, RangeSelect, StatsError } from "@/components/admin/ui";

type Props = { searchParams: Promise<{ range?: string }> };

// Admin → Deadline → Analytics: games, how people arrive, how prompts end, how answers match.
export default async function AdminDeadlineAnalytics({ searchParams }: Props) {
  const range = parseRange((await searchParams).range);
  const [result, waiting] = await Promise.all([getDeadlineAnalytics(range), getDeadlineWaiting()]);
  const header = (
    <PageHeader
      title="Deadline"
      description="How the party game is played: games, arrivals, prompts and answers."
      right={<div className="flex flex-wrap items-center gap-sm"><DeadlineTabs current="analytics" waiting={waiting} /><RangeSelect basePath="/admin/deadline/analytics" range={range} /></div>}
    />
  );
  if (!result.ok) return (<>{header}<StatsError error={result.error} /></>);
  return (
    <>
      {header}
      <DeadlineAnalyticsView data={result.data} range={range} />
    </>
  );
}
