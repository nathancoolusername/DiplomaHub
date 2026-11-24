import { getDeadlineReview, getDeadlineWaiting } from "@/app/lib/admin-deadline-stats";
import { DeadlineReview } from "@/components/admin/DeadlineReview";
import { DeadlineTabs } from "@/components/admin/DeadlineTabs";
import { PageHeader, StatsError } from "@/components/admin/ui";

// Admin → Deadline → Missing answers: rejected answers that might be right, and fuzzy accepts that might be wrong.
export default async function AdminDeadlineReviewPage() {
  const [result, waiting] = await Promise.all([getDeadlineReview(), getDeadlineWaiting()]);
  return (
    <>
      <PageHeader title="Deadline" description="Fix the answer lists from what players actually type." right={<DeadlineTabs current="review" waiting={waiting} />} />
      {result.ok ? <DeadlineReview prompts={result.data} /> : <StatsError error={result.error} />}
    </>
  );
}
