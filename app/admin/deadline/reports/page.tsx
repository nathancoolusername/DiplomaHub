import { getDeadlineReports, getDeadlineWaiting } from "@/app/lib/admin-deadline-stats";
import { DeadlineReports } from "@/components/admin/DeadlineReports";
import { DeadlineTabs } from "@/components/admin/DeadlineTabs";
import { PageHeader, StatsError } from "@/components/admin/ui";

// Admin → Deadline → Reports: room chat messages players reported. Three reports hide a message on their own.
export default async function AdminDeadlineReportsPage() {
  const [result, waiting] = await Promise.all([getDeadlineReports(), getDeadlineWaiting()]);
  return (
    <>
      <PageHeader title="Deadline" description="Reported room chat. Three reports from different players hide a message automatically; you can hide one sooner." right={<DeadlineTabs current="reports" waiting={waiting} />} />
      {result.ok ? <DeadlineReports reports={result.data} /> : <StatsError error={result.error} />}
    </>
  );
}
