import { Bone, CardBone, SkeletonPage } from "@/components/shared/Skeleton";

// Inside the admin layout (header and tabs stay): title, stat cards, a chart.
export default function AdminLoading() {
  return (
    <SkeletonPage className="flex flex-col gap-lg">
      <div className="flex flex-wrap items-end justify-between gap-md">
        <div className="flex flex-col gap-xs">
          <Bone className="h-9 w-48" />
          <Bone className="h-4 w-80 max-w-full" />
        </div>
        <Bone className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        {Array.from({ length: 4 }, (_, i) => (
          <CardBone key={i}>
            <Bone className="h-4 w-24" />
            <Bone className="h-10 w-20" />
            <Bone className="h-4 w-28" />
          </CardBone>
        ))}
      </div>
      <CardBone>
        <Bone className="h-6 w-40" />
        <Bone className="h-56 w-full" />
      </CardBone>
    </SkeletonPage>
  );
}
