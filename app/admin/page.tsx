import { getAdminStats, getAdminAnalytics } from "@/app/lib/actions/admin";
import { LineChart } from "@/components/admin/charts/LineChart";
import { BarChart } from "@/components/admin/charts/BarChart";

// Chart-safe variants of the brand hues (primary/secondary/tertiary) —
// the exact brand hex values fail the categorical-palette checks (too dark
// / too low-chroma to read as distinct series). Validated with the dataviz
// skill's validate_palette.js: all 6 checks pass at this ordering.
const CHART_BLUE = "#2f53ce"; // resources / primary single-series color
const CHART_TEAL = "#00a294"; // articles
const CHART_AMBER = "#c9820a"; // discussions

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-sm bg-surface-container-lowest border-1 border-outline-variant rounded-xl p-lg basis-1/3">
      <p className="text-on-surface-variant text-body-lg">{label}</p>
      <p className="text-display-lg font-serif font-bold text-primary">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-md bg-surface-container-lowest border-1 border-outline-variant rounded-xl p-lg flex-1 min-w-0">
      <div>
        <h2 className="font-serif text-headline-md font-bold">{title}</h2>
        {description && (
          <p className="text-on-surface-variant text-label-md">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [statsResult, analyticsResult] = await Promise.all([
    getAdminStats(),
    getAdminAnalytics(),
  ]);

  if (!statsResult.success) {
    return (
      <p className="text-red-500">Failed to load stats: {statsResult.error}</p>
    );
  }
  const stats = statsResult.data;

  return (
    <div className="flex flex-col gap-margin">
      <div className="flex flex-row gap-margin flex-wrap">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Resources" value={stats.totalResources} />
        <StatCard label="Articles" value={stats.totalArticles} />
        <StatCard label="Discussions" value={stats.totalDiscussions} />
      </div>

      {analyticsResult.success && (
        <>
          <div className="flex flex-row gap-margin flex-wrap">
            <StatCard
              label="Total Downloads"
              value={analyticsResult.data.totalDownloads}
            />
            <StatCard
              label="Total Resource Likes"
              value={analyticsResult.data.totalLikes}
            />
            <StatCard
              label="Unpublished Resources"
              value={stats.unpublishedResources}
            />
            <StatCard
              label="Unpublished Articles"
              value={stats.unpublishedArticles}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-margin">
            <ChartCard
              title="New Content"
              description="Resources, articles, and discussions created — last 30 days"
            >
              <LineChart
                series={[
                  {
                    key: "resources",
                    label: "Resources",
                    color: CHART_BLUE,
                    data: analyticsResult.data.newResources,
                  },
                  {
                    key: "articles",
                    label: "Articles",
                    color: CHART_TEAL,
                    data: analyticsResult.data.newArticles,
                  },
                  {
                    key: "discussions",
                    label: "Discussions",
                    color: CHART_AMBER,
                    data: analyticsResult.data.newDiscussions,
                  },
                ]}
              />
            </ChartCard>

            <ChartCard title="New Users" description="Signups — last 30 days">
              <LineChart
                series={[
                  {
                    key: "users",
                    label: "Users",
                    color: CHART_BLUE,
                    data: analyticsResult.data.newUsers,
                  },
                ]}
              />
            </ChartCard>
          </div>

          <ChartCard
            title="Most Downloaded Resources"
            description="Top 8 by download count"
          >
            <BarChart
              color={CHART_BLUE}
              data={analyticsResult.data.topResources.map((r) => ({
                label: r.title,
                value: r.download_count,
              }))}
            />
          </ChartCard>

          <div className="flex flex-col lg:flex-row gap-margin">
            <ChartCard title="Resources by Subject">
              <BarChart
                color={CHART_TEAL}
                data={analyticsResult.data.resourcesBySubject.map((r) => ({
                  label: r.label,
                  value: r.count,
                }))}
              />
            </ChartCard>

            <ChartCard title="Resources by Type">
              <BarChart
                color={CHART_AMBER}
                data={analyticsResult.data.resourcesByType.map((r) => ({
                  label: r.label,
                  value: r.count,
                }))}
              />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
