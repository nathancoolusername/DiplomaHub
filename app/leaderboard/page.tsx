import type { Metadata } from "next";
import { getLeaderboardPage } from "@/app/lib/actions/profile";
import { getCurrentUser } from "@/app/lib/get-current-user";
import LeaderboardList from "@/components/leaderboard/LeaderboardList";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "See the top contributors in the DiplomaHub community, ranked by points earned from resources, articles, and discussions.",
  alternates: { canonical: "/leaderboard" },
};

const PAGE_SIZE = 20;

export default async function LeaderboardPage() {
  const [result, currentUser] = await Promise.all([
    getLeaderboardPage({ page: 1, pageSize: PAGE_SIZE }),
    getCurrentUser(),
  ]);

  if (!result.success) {
    return (
      <p className="text-red-500">
        Failed to load leaderboard: {result.error}
      </p>
    );
  }

  return (
    <div className="flex flex-col bg-surface-bright px-margin py-lg gap-margin">
      <div>
        <h1 className="text-display-lg font-serif font-bold">Leaderboard</h1>
        <p className="text-on-surface-variant text-body-lg w-full md:w-170">
          The top contributors in the DiplomaHub community, ranked by points
          earned from resources, articles, and discussions.
        </p>
      </div>

      <LeaderboardList
        initialItems={result.data.items}
        initialTotalCount={result.data.totalCount}
        currentUserId={currentUser?.id ?? null}
      />
    </div>
  );
}
