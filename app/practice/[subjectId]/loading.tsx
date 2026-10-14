import { Bone, CardBone, SkeletonPage } from "@/components/shared/Skeleton";

// A subject (app/practice/[subjectId]/page.tsx): heading with general info, practice boxes, strength map.
export default function SubjectLoading() {
  return (
    <SkeletonPage className="max-w-[1200px] mx-auto px-md py-xl flex flex-col gap-xl">
      <div className="grid lg:grid-cols-[1fr_380px] gap-lg items-start">
        <div className="flex flex-col gap-sm">
          <Bone className="h-4 w-20" />
          <Bone className="h-12 w-80 max-w-full" />
        </div>
        <CardBone>
          <Bone className="h-5 w-32" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
          <Bone className="h-4 w-2/3" />
        </CardBone>
      </div>
      <div className="flex flex-col gap-md">
        <Bone className="h-7 w-32" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-md">
          {Array.from({ length: 4 }, (_, i) => (
            <CardBone key={i}>
              <Bone className="h-11 w-11" />
              <Bone className="h-5 w-3/4" />
              <Bone className="h-4 w-full" />
            </CardBone>
          ))}
        </div>
      </div>
      <Bone className="h-72" />
    </SkeletonPage>
  );
}
