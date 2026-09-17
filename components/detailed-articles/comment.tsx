import { Trash2 } from "lucide-react";
import { ibYearTitleTag } from "../pills";
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

type Props = {
  content: string;
  createdAt: string;
  author?: Author;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
};

export default function Comment({
  content,
  createdAt,
  author,
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
              <p className="text-primary text-body-lg break-words">
                {author?.display_name ?? "Deleted user"}
              </p>
              {ibYearTitleTag(author?.ib_year)}
              {author?.is_pro && (
                <DiplomaProBadge className="text-on-primary-fixed-variant font-bold" />
              )}
            </div>
            <div className="flex flex-row items-center gap-sm shrink-0">
              <p className="text-on-surface-container text-body-md">
                {formatRelativeTime(createdAt)}
              </p>
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
          <p className="text-body-lg">{content}</p>
        </div>
      </div>
    </div>
  );
}
