import { Bone, CardBone, SkeletonPage } from "@/components/shared/Skeleton";

// Practice (app/practice/page.tsx): greeting, plan banner, your six subjects, strength maps.
export default function PracticeLoading() {
  return (
    <SkeletonPage className="max-w-[1200px] mx-auto px-md py-xl flex flex-col gap-xl">
      <div className="flex flex-col gap-sm">
        <Bone className="h-10 w-64" />
        <Bone className="h-5 w-80 max-w-full" />
      </div>
      <Bone className="h-14" />
      <div className="flex flex-col gap-md">
        <div className="flex items-end justify-between">
          <Bone className="h-7 w-40" />
          <Bone className="h-9 w-36" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-md">
          {Array.from({ length: 6 }, (_, i) => (
            <CardBone key={i} className="min-h-40">
              <div className="flex justify-between gap-sm">
                <Bone className="h-6 w-2/3" />
                <Bone className="h-6 w-10" />
              </div>
              <div className="mt-auto flex flex-col gap-xs">
                <Bone className="h-3 w-full" />
                <Bone className="h-4 w-1/2" />
              </div>
            </CardBone>
          ))}
        </div>
      </div>
      <Bone className="h-56" />
    </SkeletonPage>
  );
}
