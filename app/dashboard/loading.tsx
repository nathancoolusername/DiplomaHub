import { Bone, CardBone, SkeletonPage } from "@/components/shared/Skeleton";

// Signed-in Home (components/home/pro-home/DiplomaProHome.tsx): greeting and countdown,
// suggestions with the Practice/Hub buttons, Getting started, next days, strength maps.
export default function HomeLoading() {
  return (
    <SkeletonPage className="bg-surface-container-low">
      <div className="max-w-[1200px] mx-auto px-md py-xl flex flex-col gap-xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-lg">
          <div className="flex flex-col gap-sm">
            <Bone className="h-10 w-72" />
            <Bone className="h-5 w-56" />
          </div>
          <Bone className="h-12 w-60" />
        </div>
        <div className="grid md:grid-cols-[1fr_auto] gap-md">
          <div className="grid sm:grid-cols-2 gap-md">
            <Bone className="h-28" />
            <Bone className="h-28" />
          </div>
          <div className="flex md:flex-col gap-sm md:w-48">
            <Bone className="h-14 flex-1" />
            <Bone className="h-14 flex-1" />
          </div>
        </div>
        <CardBone>
          <Bone className="h-6 w-40" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-3/4" />
        </CardBone>
        <div className="grid md:grid-cols-3 gap-md">
          <Bone className="h-24" />
          <Bone className="h-24" />
          <Bone className="h-24" />
        </div>
        <Bone className="h-48" />
      </div>
    </SkeletonPage>
  );
}
