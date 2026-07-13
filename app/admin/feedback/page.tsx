import { getAllFeedback } from "@/app/lib/actions/admin";
import { FeedbackTable } from "@/components/admin/FeedbackTable";

export default async function AdminFeedbackPage() {
  const result = await getAllFeedback();

  if (!result.success) {
    return (
      <p className="text-red-500">Failed to load feedback: {result.error}</p>
    );
  }

  return <FeedbackTable feedback={result.data} />;
}
