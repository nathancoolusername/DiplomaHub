"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import Button from "../button";
import Comment from "./comment";
import { addComment, deleteComment } from "@/app/lib/actions/comments";
import { replyToDiscussion, deleteReply } from "@/app/lib/actions/discussions";
import { isAdmin } from "@/app/lib/admin";
import { Spinner } from "@/components/spinner";
import type { Comment as CommentType, DiscussionReply } from "@/app/lib/types";

type CommentTarget = { resource_id: string } | { article_id: string };
type ReplyTarget = { discussion_id: string };

type Props =
  | {
      kind: "comment";
      target: CommentTarget;
      initialItems: CommentType[];
      path: string;
      isLoggedIn: boolean;
      currentUserId?: string | null;
    }
  | {
      kind: "reply";
      target: ReplyTarget;
      initialItems: DiscussionReply[];
      path: string;
      isLoggedIn: boolean;
      currentUserId?: string | null;
    };

export default function Comments(props: Props) {
  const { kind, target, initialItems, path, isLoggedIn, currentUserId } = props;
  const router = useRouter();
  const [shown, setShown] = useState(3);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const filtered = initialItems.slice(0, shown);
  const noun = kind === "comment" ? "comments" : "replies";

  async function handleDelete(itemId: string) {
    if (!confirm(`Delete this ${kind === "comment" ? "comment" : "reply"}?`))
      return;

    setDeletingId(itemId);
    const result =
      kind === "comment"
        ? await deleteComment(itemId, path)
        : await deleteReply(itemId, (target as ReplyTarget).discussion_id);

    if (result.success) {
      router.refresh();
    } else {
      setDeletingId(null);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim() || posting) return;
    setPosting(true);
    setError(null);

    const result =
      kind === "comment"
        ? await addComment(target as CommentTarget, content, path)
        : await replyToDiscussion(
            (target as ReplyTarget).discussion_id,
            content,
          );

    if (result.success) {
      setContent("");
      router.refresh();
    } else {
      setError(result.error);
    }
    setPosting(false);
  }

  return (
    <div className="mt-25 flex flex-col gap-gutter">
      <div className="flex flex-row flex-wrap items-center gap-md">
        <h1 className="text-headline-lg font-serif font-bold">
          {kind === "comment" ? "Conversation" : "Community Replies"}
        </h1>
        <div className="shrink-0 border-1 border-outline-variant px-sm rounded-xl uppercase text-on-surface-variant">
          {initialItems.length} {noun}
        </div>
      </div>

      <div className="p-lg bg-surface-container-low w-full border-1 border-outline-variant flex flex-col">
        <div className="flex flex-row gap-gutter">
          <User
            size={45}
            className="bg-surface-container-high p-sm border-1 border-outline-variant text-primary rounded-xl"
          />
          {isLoggedIn ? (
            <form className="w-full" onSubmit={handleSubmit}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-30 w-full bg-surface-container-lowest border-1 border-outline-variant rounded-xl p-md mb-5"
                placeholder={
                  kind === "comment"
                    ? "Add to the Discussion ..."
                    : "Write a reply ..."
                }
              />
              {error && (
                <p className="text-red-500 text-body-sm mb-sm">{error}</p>
              )}
              <div className="mr-0 ml-auto float-right">
                <Button
                  className={posting ? "opacity-50 pointer-events-none" : ""}
                >
                  {posting && <Spinner size={16} />}
                  {posting
                    ? "Posting..."
                    : kind === "comment"
                      ? "Post Perspective"
                      : "Post Reply"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-on-surface-variant self-center">
              Log in to join the discussion.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-10 mt-20">
        {filtered.length === 0 && (
          <p className="text-on-surface-variant text-body-md">
            No {noun} yet — be the first to post.
          </p>
        )}
        {filtered.map((item) => {
          const ownerId =
            kind === "comment"
              ? (item as CommentType).user_id
              : (item as DiscussionReply).author_id;
          const canDelete =
            !!currentUserId &&
            (currentUserId === ownerId || isAdmin(currentUserId));

          return (
            <div key={item.id} className="w-full">
              <Comment
                content={item.content}
                createdAt={item.created_at}
                author={item.author}
                canDelete={canDelete}
                deleting={deletingId === item.id}
                onDelete={() => handleDelete(item.id)}
                like={
                  kind === "reply"
                    ? {
                        target: { discussion_reply_id: item.id },
                        initiallyLiked:
                          (item as DiscussionReply).isLiked ?? false,
                        initialCount: (item as DiscussionReply).like_count,
                        path,
                      }
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>

      {shown < initialItems.length && (
        <button
          onClick={() => setShown(shown + 3)}
          className="text-primary font-bold border-1 border-outline-variant h-15 w-68 rounded-xl self-center hover:bg-surface-container-low cursor-pointer"
        >
          Load additional perspectives
        </button>
      )}
    </div>
  );
}
