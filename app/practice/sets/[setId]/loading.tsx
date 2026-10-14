import { Bone, CardBone, SkeletonPage } from "@/components/shared/Skeleton";

// Reorder or remove a set's questions: heading, then the question list.
export default function SetQuestionsLoading() {
  return (
    <SkeletonPage className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-lg">
      <Bone className="h-4 w-24" />
      <Bone className="h-10 w-72 max-w-full" />
      {Array.from({ length: 5 }, (_, i) => (
        <CardBone key={i}>
          <Bone className="h-4 w-1/3" />
          <Bone className="h-4 w-full" />
        </CardBone>
      ))}
    </SkeletonPage>
  );
}
