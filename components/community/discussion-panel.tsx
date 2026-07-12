import Link from "next/link";
import { Users, MessageSquare } from "lucide-react";
import { ibYearTitleTag } from "../pills";
import { SaveButton } from "../saveButton";
import { LikeButton } from "../likeButton";
import { formatRelativeTime } from "@/app/lib/relativeTime";

type PanelDiscussion = {
  id: string | number;
  title: string;
  content: string;
  subject_tag?: string | null;
  type_tag: string | null;
  like_count: number;
  reply_count: number;
  created_at: string | Date;
  top_reply?: string | null;
  isLiked?: boolean;
  isSaved?: boolean;
  author?: {
    name?: string;
    display_name?: string;
    ib_year?: "Pre-IB" | "DP1" | "DP2" | "Alumni" | "Educator" | null;
    is_pro?: boolean;
  };
};

type Props = {
  discussion: PanelDiscussion;
  href?: string;
};

export const typeTags: Tags = {
  Discussion:
    "px-md h-9 rounded-3xl py-1 bg-surface-container-high text-on-surface-variant items-center",
  Resource:
    "px-md h-9 rounded-3xl py-1 bg-secondary-container text-on-secondary-container items-center",
  Question:
    "px-md h-9 rounded-3xl py-1 bg-tertiary-container text-on-tertiary-container items-center",
};

type Tags = {
  [key: string]: string;
};

export default function Panel({ discussion, href }: Props) {
  const linkHref = href ?? `/community/${discussion.id}`;
  const finalTime = formatRelativeTime(discussion.created_at);

  return (
    <div className="cursor-pointer hover:drop-shadow-xl/10 transition flex flex-col bg-surface-container-lowest border-1 border-outline-variant p-md rounded-md gap-lg">
      <Link href={linkHref} className="flex flex-col gap-lg">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row items-center gap-md">
            <div className="border-1 border-outline-variant rounded-[50%] h-15 w-15 items-center justify-items-center pt-2">
              <Users size={40} />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-row gap-sm items-center">
                <h1 className="text-body-md font-bold">
                  {discussion.author?.display_name ?? discussion.author?.name}
                </h1>{" "}
                <div className="flex flex-row gap-sm">
                  {ibYearTitleTag(discussion.author?.ib_year)}
                  <h1 className="text-on-primary-fixed-variant font-bold">
                    {discussion.author?.is_pro ? "Diploma Pro" : ""}
                  </h1>
                </div>
              </div>
              <div className="flex flex-row gap-sm items-center">
                <h1 className="text-on-surface-variant text-label-md">
                  Posted {finalTime} in{" "}
                </h1>{" "}
                <h1 className="text-on-primary-fixed-variant">
                  {discussion.subject_tag}
                </h1>
              </div>
            </div>
          </div>
          <h1
            className={discussion.type_tag ? typeTags[discussion.type_tag] : ""}
          >
            {discussion.type_tag}
          </h1>
        </div>

        <div>
          <h1 className="text-headline-md font-serif">{discussion.title}</h1>
        </div>

        <h1 className="text-on-surface-variant text-body-lg">
          {discussion.content}
        </h1>

        {discussion.top_reply && (
          <div className="flex flex-row gap-md bg-surface-container-low py-md px-sm rounded-xl items-center">
            <h1 className="italic text-on-surface-variant text-body-sm">
              &ldquo;{discussion.top_reply}&rdquo;
            </h1>
          </div>
        )}
      </Link>

      <div className="border-t-1 border-outline-variant mt-auto pt-md flex flex-row">
        <div className="flex flex-row items-center">
          <LikeButton
            target={{ discussion_id: String(discussion.id) }}
            initiallyLiked={discussion.isLiked ?? false}
            initialCount={discussion.like_count}
            path="/community"
          />
          <div className="text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl">
            <MessageSquare />
          </div>
          <h1 className="text-on-surface-variant text-body-lg ml-sm">
            {discussion.reply_count}
          </h1>
        </div>
        <SaveButton
          target={{ discussion_id: String(discussion.id) }}
          initiallySaved={discussion.isSaved ?? false}
          path="/community"
        />
      </div>
    </div>
  );
}
