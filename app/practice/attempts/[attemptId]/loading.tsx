import { Bone, CardBone, SkeletonPage } from "@/components/shared/Skeleton";

// Marking or results: heading and score, then one card per question.
export default function AttemptLoading() {
  return (
    <SkeletonPage className="max-w-[1200px] mx-auto px-md py-xl flex flex-col gap-lg">
      <div className="flex flex-col gap-sm">
        <Bone className="h-4 w-24" />
        <Bone className="h-12 w-64" />
      </div>
      <div className="grid sm:grid-cols-3 gap-md">
        <Bone className="h-24" />
        <Bone className="h-24" />
        <Bone className="h-24" />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <CardBone key={i}>
          <Bone className="h-5 w-48" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-4/5" />
        </CardBone>
      ))}
    </SkeletonPage>
  );
}
