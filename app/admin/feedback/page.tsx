import { getFeedbackPage } from "@/app/lib/actions/admin";
import { FeedbackTable } from "@/components/admin/FeedbackTable";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminFeedbackPage() {
  const result = await getFeedbackPage({ page: 1 });

  if (!result.success) {
    return (
      <p className="text-error">Failed to load feedback: {result.error}</p>
    );
  }

  return (
    <>
      <PageHeader title="Feedback" description="What students sent through the feedback form." />
      <FeedbackTable initialItems={result.data.items} initialTotalCount={result.data.totalCount} />
    </>
  );
}
