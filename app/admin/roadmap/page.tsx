import { getRoadmapItems } from "@/app/lib/actions/roadmap";
import { RoadmapTable } from "@/components/admin/RoadmapTable";

export default async function AdminRoadmapPage() {
  const result = await getRoadmapItems();

  if (!result.success) {
    return (
      <p className="text-red-500">Failed to load roadmap: {result.error}</p>
    );
  }

  return <RoadmapTable items={result.data} />;
}
