import Link from "next/link";
import { notFound } from "next/navigation";
import { SEED_DISCUSSIONS } from "@/components/data";
import {
  ChevronRight,
  CircleUser,
  Calendar,
  Bookmark,
  Heart,
  Share2,
  FileText,
  Download,
  BadgeCheck,
} from "lucide-react";
import Comments from "@/components/detailed-articles/comments";
import { typeTags } from "@/components/community/discussion-panel";
import { TitleTag } from "@/components/pills";

export default async function DiscussionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const discussion = SEED_DISCUSSIONS.find((a) => a.id === id);
  if (!discussion) {
    notFound();
  }
  const final_like =
    discussion.like_count >= 1000
      ? (() => {
          const shortened = discussion.like_count / 1000;
          return `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`;
        })()
      : discussion.like_count;

  let finalTime;
  let difference;
  const today = new Date();
  const last_I = today.toISOString().lastIndexOf("-");
  if (
    today.toISOString().split("T")[0] ==
    discussion.created_at.toISOString().split("T")[0]
  ) {
    finalTime = `${today.getHours() - discussion.created_at.getHours()}h`;
  } else if (
    today.toISOString().slice(0, last_I) ==
    discussion.created_at.toISOString().slice(0, last_I)
  ) {
    difference = today.getDate() - discussion.created_at.getDate() === 1;
    finalTime = `${today.getDate() - discussion.created_at.getDate()} ${difference ? "day" : "days"}`;
  } else if (
    today.toISOString().split("-")[0] ==
    discussion.created_at.toISOString().split("-")[0]
  ) {
    difference = today.getMonth() - discussion.created_at.getMonth() === 1;
    finalTime = `${today.getMonth() - discussion.created_at.getMonth()} ${difference ? "month" : "months"}`;
  } else {
    difference =
      today.getFullYear() - discussion.created_at.getFullYear() === 1;
    finalTime = `${today.getFullYear() - discussion.created_at.getFullYear()} ${difference ? "year" : "years"}`;
  }

  return (
    <div className="flex flex-col px-50 py-10  gap-gutter bg-surface-container-low">
      <div className="flex flex-row gap-sm items-center">
        <Link href={"/community"}>
          <h1 className={`text-on-surface-variant text-headline-md uppercase`}>
            discussions
          </h1>
        </Link>
        <ChevronRight />
        <h1 className={`text-secondary text-headline-md uppercase`}>
          {discussion.subject_tag}
        </h1>
      </div>
      <div className="flex flex-row gap-margin">
        <div className="flex flex-col gap-margin  basis-2/3">
          <div className="flex flex-col bg-surface-container-lowest p-margin rounded-xl border-1 border-outline-variant gap-lg">
            <h1 className={typeTags[discussion.type_tag]}>
              {discussion.type_tag}
            </h1>

            <h1 className={`font-serif text-display-lg font-bold`}>
              {discussion.title}
            </h1>

            <div className="border-b-1 border-outline-variant flex flex-row pb-md gap-20">
              <div className="flex flex-row items-center gap-sm">
                <CircleUser />
                <div className="flex flex-col">
                  <h1 className="text-body-lg">{discussion.author.name}</h1>
                  <div className="flex flex-row gap-sm">
                    {TitleTag[discussion.author.title]}
                    <h1 className="text-on-primary-fixed-variant font-bold">
                      {discussion.author.is_pro ? "IB Pro" : ""}
                    </h1>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <h1 className="text-body-lg">Uploaded</h1>
                <div className="flex flex-row items-center gap-sm">
                  <Calendar className="text-on-surface-variant" />
                  <h1 className="text-on-surface-variant text-label-md">
                    {finalTime} ago
                  </h1>
                </div>
              </div>
              <div className="flex flex-col gap-sm">
                <h1 className="text-body-lg">Likes</h1>
                <h1 className="text-label-md text-on-surface-variant">
                  {final_like}
                </h1>
              </div>
            </div>
            <div className="flex flex-col gap-lg mt-md">
              <h1 className="text-on-surface-variant text-body-lg">
                {discussion.content}
              </h1>
              <div className="ml-auto text-primary flex flex-row">
                <div className="text-on-surface-variant transition hover:text-[#f50707] hover:bg-surface-container p-sm rounded-xl cursor-pointer hover:border-outline-variant border-white border-b-1">
                  <Heart size={30} />
                </div>
                <div className="ml-auto text-on-surface-variant rounded-xl flex flex-row  items-center">
                  <Bookmark
                    size={46}
                    className="rounded-xl text-display-lg transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"
                  />
                  <Share2
                    size={46}
                    className="rounded-xl transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          <Comments />
        </div>
        <div className="basis-1/3 flex flex-col gap-margin">
          <div className="h-65 w-full bg-surface-container-lowest p-md  border-1 border-outline-variant rounded-xl flex flex-col gap-md">
            <h1 className="text-body-lg uppercase text-primary">
              About the Author
            </h1>
            <div className="flex flex-row items-center gap-md">
              <CircleUser size={50} />
              <div className="flex flex-col">
                <h1 className="text-headline-lg font-serif">
                  {discussion.author.name}
                </h1>
                <h1 className="text-body-md text-primary">IB Educator</h1>
              </div>
            </div>
            <h1 className="text-body-md text-on-surface-variant">
              {discussion.author.name} has contributed to over 20 high-scoring
              examplars to the IBPeople community.
            </h1>
            <button className="bg-surface-variant-lowest text-primary border-1 border-primary py-sm hover:bg-surface-container cursor-pointer">
              View Full Profile
            </button>
          </div>

          <div className="h-60 w-full bg-surface-container-lowest p-lg border-1 border-outline-variant rounded-xl flex flex-col gap-md">
            <h1 className="font-serif text-headline-md">Top Contributors</h1>
            <div className="bg-surface-container-low w-full h-24 rounded-xl flex items-center justify-center">
              <h1 className="font-semibold text-headline-md font-serif text-on-primary-fixed">
                Coming Soon...
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
