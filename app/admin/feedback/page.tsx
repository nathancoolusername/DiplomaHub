import { getFeedbackPage } from "@/app/lib/actions/admin";
import { FeedbackTable } from "@/components/admin/FeedbackTable";

export default async function AdminFeedbackPage() {
  const result = await getFeedbackPage({ page: 1 });

  if (!result.success) {
    return (
      <p className="text-red-500">Failed to load feedback: {result.error}</p>
    );
  }

  return (
    <FeedbackTable
      initialItems={result.data.items}
      initialTotalCount={result.data.totalCount}
    />
  );
}
