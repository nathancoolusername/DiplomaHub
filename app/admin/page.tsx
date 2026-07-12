import { getAdminStats } from "@/app/lib/actions/admin";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-sm bg-surface-container-lowest border-1 border-outline-variant rounded-xl p-lg basis-1/3">
      <h1 className="text-on-surface-variant text-body-lg">{label}</h1>
      <h1 className="text-display-lg font-serif font-bold text-primary">
        {value.toLocaleString()}
      </h1>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const result = await getAdminStats();

  if (!result.success) {
    return <p className="text-red-500">Failed to load stats: {result.error}</p>;
  }
  const stats = result.data;

  return (
    <div className="flex flex-col gap-margin">
      <div className="flex flex-row gap-margin flex-wrap">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Resources" value={stats.totalResources} />
        <StatCard label="Articles" value={stats.totalArticles} />
        <StatCard label="Discussions" value={stats.totalDiscussions} />
      </div>
    </div>
  );
}
