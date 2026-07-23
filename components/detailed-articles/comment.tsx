import { Trash2 } from "lucide-react";
import { ibYearTitleTag } from "../pills";
import { LikeButton } from "../likeButton";
import { Avatar } from "../avatar";
import { Spinner } from "../spinner";
import { DiplomaProBadge } from "../DiplomaProBadge";
import { formatRelativeTime } from "@/app/lib/relativeTime";

type Author = {
  display_name: string;
  is_pro: boolean;
  ib_year?: "Pre-IB" | "DP1" | "DP2" | "Alumni" | "Educator" | null;
  avatar_url?: string | null;
} | null;

type LikeProps = {
  target: { discussion_reply_id: string };
  initiallyLiked: boolean;
  initialCount: number;
  path: string;
};

type Props = {
  content: string;
  createdAt: string;
  author?: Author;
  like?: LikeProps;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
};

export default function Comment({
  content,
  createdAt,
  author,
  like,
  canDelete,
  deleting,
  onDelete,
}: Props) {
  return (
    <div className="flex flex-row gap-md w-full">
      <Avatar
        src={author?.avatar_url}
        name={author?.display_name ?? "Deleted user"}
        size={50}
      />
      <div className="flex flex-col gap-sm w-full">
        <div className="flex flex-col px-lg py-6 border-1 border-outline-variant rounded-xl w-full gap-lg bg-surface-container-lowest">
          <div className="flex flex-row flex-wrap justify-between gap-sm">
            <div className="flex flex-row flex-wrap gap-sm items-center">
              <h1 className="text-primary text-body-lg break-words">
                {author?.display_name ?? "Deleted user"}
              </h1>
              {ibYearTitleTag(author?.ib_year)}
              {author?.is_pro && (
                <DiplomaProBadge className="text-on-primary-fixed-variant font-bold" />
              )}
            </div>
            <div className="flex flex-row items-center gap-sm shrink-0">
              <h1 className="text-on-surface-container text-body-md">
                {formatRelativeTime(createdAt)}
              </h1>
              {canDelete && (
                <button
                  onClick={onDelete}
                  disabled={deleting}
                  className="text-on-surface-variant transition hover:text-red-500 cursor-pointer disabled:opacity-50"
                  aria-label="Delete"
                >
                  {deleting ? <Spinner size={18} /> : <Trash2 size={18} />}
                </button>
              )}
            </div>
          </div>
          <h1 className="text-body-lg">{content}</h1>
        </div>
        {like && (
          <div className="flex flex-row w-full gap-md">
            <LikeButton
              target={like.target}
              initiallyLiked={like.initiallyLiked}
              initialCount={like.initialCount}
              path={like.path}
              size={20}
              className="text-on-surface-container flex flex-row items-center gap-sm text-label-md hover:text-primary transition cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
