import { Bone, CardBone, SkeletonPage } from "@/components/shared/Skeleton";

// Build your set: heading, then the settings form and the set summary.
export default function BuildLoading() {
  return (
    <SkeletonPage className="max-w-[1200px] mx-auto px-md pt-xl pb-xl flex flex-col gap-lg">
      <div className="flex flex-col gap-sm">
        <Bone className="h-4 w-24" />
        <Bone className="h-12 w-72 max-w-full" />
        <Bone className="h-5 w-48" />
      </div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-lg items-start">
        <CardBone>
          <Bone className="h-5 w-40" />
          <div className="flex flex-wrap gap-sm">
            {Array.from({ length: 8 }, (_, i) => (
              <Bone key={i} className="h-9 w-32" />
            ))}
          </div>
          <Bone className="h-5 w-32 mt-md" />
          <Bone className="h-10 w-full" />
          <Bone className="h-5 w-28 mt-md" />
          <Bone className="h-10 w-2/3" />
        </CardBone>
        <CardBone>
          <Bone className="h-6 w-32" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-3/4" />
          <Bone className="h-12 w-full mt-md" />
        </CardBone>
      </div>
    </SkeletonPage>
  );
}
