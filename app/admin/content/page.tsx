import { getAdminResourcesPage, getAdminContentCounts } from "@/app/lib/actions/admin";
import { ContentTable } from "@/components/admin/ContentTable";

export default async function AdminContentPage() {
  const [resourcesResult, countsResult] = await Promise.all([
    getAdminResourcesPage({ page: 1 }),
    getAdminContentCounts(),
  ]);

  if (!resourcesResult.success) {
    return (
      <p className="text-red-500">
        Failed to load content: {resourcesResult.error}
      </p>
    );
  }

  return (
    <ContentTable
      initialItems={resourcesResult.data.items}
      initialTotalCount={resourcesResult.data.totalCount}
      initialCounts={
        countsResult.success
          ? countsResult.data
          : { resources: 0, articles: 0, discussions: 0 }
      }
    />
  );
}
