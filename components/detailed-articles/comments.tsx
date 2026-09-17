"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import Button from "../button";
import Comment from "./comment";
import { addComment, deleteComment } from "@/app/lib/actions/comments";
import { isAdmin } from "@/app/lib/admin";
import { Spinner } from "@/components/spinner";
import type { Comment as CommentType } from "@/app/lib/types";

type CommentTarget = { resource_id: string } | { article_id: string };

type Props = {
  target: CommentTarget;
  initialItems: CommentType[];
  path: string;
  isLoggedIn: boolean;
  currentUserId?: string | null;
};

export default function Comments({ target, initialItems, path, isLoggedIn, currentUserId }: Props) {
  const router = useRouter();
  const [shown, setShown] = useState(3);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const filtered = initialItems.slice(0, shown);

  async function handleDelete(itemId: string) {
    if (!confirm("Delete this comment?")) return;

    setDeletingId(itemId);
    const result = await deleteComment(itemId, path);

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

    const result = await addComment(target, content, path);

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
        <h2 className="text-headline-lg font-serif font-bold">Conversation</h2>
        <div className="shrink-0 border-1 border-outline-variant px-sm rounded-xl uppercase text-on-surface-variant">
          {initialItems.length} comments
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
                placeholder="Add to the Discussion ..."
              />
              {error && (
                <p className="text-red-500 text-body-sm mb-sm">{error}</p>
              )}
              <div className="mr-0 ml-auto float-right">
                <Button
                  className={posting ? "opacity-50 pointer-events-none" : ""}
                >
                  {posting && <Spinner size={16} />}
                  {posting ? "Posting..." : "Post Perspective"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-on-surface-variant self-center hover:text-primary">
              <Link href={`/login`}>Log in to join the discussion.</Link>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-10 mt-20">
        {filtered.length === 0 && (
          <p className="text-on-surface-variant text-body-md">
            No comments yet — be the first to post.
          </p>
        )}
        {filtered.map((item) => {
          const canDelete =
            !!currentUserId &&
            (currentUserId === item.user_id || isAdmin(currentUserId));

          return (
            <div key={item.id} className="w-full">
              <Comment
                content={item.content}
                createdAt={item.created_at}
                author={item.author}
                canDelete={canDelete}
                deleting={deletingId === item.id}
                onDelete={() => handleDelete(item.id)}
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
