import { getModerationCounts } from "@/app/lib/actions/admin-moderation";
import { ModerationTable } from "@/components/admin/ModerationTable";
import { PageHeader, StatsError } from "@/components/admin/ui";

// Moderation: everything users have posted, with hide and delete.
export default async function AdminContentPage() {
  const counts = await getModerationCounts();
  return (
    <>
      <PageHeader
        title="Moderation"
        description="Find what students posted, hide it from the site, or delete it for good. To remove a whole account or clear a profile, use Users."
      />
      {counts.success ? <ModerationTable initialCounts={counts.data} /> : <StatsError error={counts.error} />}
    </>
  );
}
