import { Bone, CardBone, SkeletonPage } from "@/components/shared/Skeleton";

// The player: top bar, question navigator, the question card.
export default function PlayLoading() {
  return (
    <SkeletonPage className="pb-28">
      <div className="border-b border-outline-variant">
        <div className="max-w-[1200px] mx-auto px-md h-14 flex items-center gap-md">
          <Bone className="h-5 w-56" />
          <Bone className="h-5 w-24 ml-auto" />
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-md pt-lg flex gap-lg">
        <div className="hidden md:flex flex-col gap-sm pt-xs">
          {Array.from({ length: 8 }, (_, i) => (
            <Bone key={i} className="h-7 w-7 rounded-[50%]" />
          ))}
        </div>
        <CardBone className="flex-1 min-w-0 md:p-xl gap-lg">
          <Bone className="h-4 w-40" />
          <Bone className="h-5 w-full" />
          <Bone className="h-5 w-5/6" />
          <Bone className="h-5 w-2/3" />
          <div className="flex flex-col gap-sm mt-md">
            {Array.from({ length: 4 }, (_, i) => (
              <Bone key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardBone>
      </div>
    </SkeletonPage>
  );
}
