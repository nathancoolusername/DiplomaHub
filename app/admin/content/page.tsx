import { getAllContentForAdmin } from "@/app/lib/actions/admin";
import { ContentTable } from "@/components/admin/ContentTable";

export default async function AdminContentPage() {
  const result = await getAllContentForAdmin();

  if (!result.success) {
    return <p className="text-red-500">Failed to load content: {result.error}</p>;
  }

  return (
    <ContentTable
      resources={result.data.resources}
      articles={result.data.articles}
      discussions={result.data.discussions}
    />
  );
}
