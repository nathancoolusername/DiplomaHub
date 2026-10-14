import { getRoadmapItems } from "@/app/lib/actions/roadmap";
import { RoadmapTable } from "@/components/admin/RoadmapTable";
import { PageHeader } from "@/components/admin/ui";

export default async function AdminRoadmapPage() {
  const result = await getRoadmapItems();

  if (!result.success) {
    return (
      <p className="text-error">Failed to load roadmap: {result.error}</p>
    );
  }

  return (
    <>
      <PageHeader title="Roadmap" description="What shows on the public roadmap page." />
      <RoadmapTable items={result.data} />
    </>
  );
}
