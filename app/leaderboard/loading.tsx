import { Bone, SkeletonPage } from "@/components/shared/Skeleton";

// Leaderboard: heading, period switch, ranked rows.
export default function LeaderboardLoading() {
  return (
    <SkeletonPage className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-lg">
      <Bone className="h-12 w-56" />
      <Bone className="h-9 w-48" />
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest divide-y divide-outline-variant">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-md px-lg py-md">
            <Bone className="h-8 w-8 rounded-[50%]" />
            <Bone className="h-9 w-9 rounded-[50%]" />
            <Bone className="h-5 flex-1 max-w-60" />
            <Bone className="h-5 w-14 ml-auto" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
