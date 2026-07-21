"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toggleLike } from "@/app/lib/actions/likes";

type LikeTarget =
  | { resource_id: string }
  | { article_id: string }
  | { discussion_id: string }
  | { discussion_reply_id: string };

export function LikeButton({
  target,
  initiallyLiked,
  initialCount,
  path,
  className,
  activeColor,
  size = 36,
}: {
  target: LikeTarget;
  initiallyLiked: boolean;
  initialCount: number;
  path: string;
  className?: string;
  activeColor?: string;
  size?: number;
}) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(initialCount);

  async function handleClick() {
    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !prevLiked;

    // Optimistic update — reflect the click instantly, revert if the
    // server call fails.
    setLiked(nextLiked);
    setCount(nextLiked ? prevCount + 1 : prevCount - 1);

    const result = await toggleLike(target, path);
    if (!result.success) {
      setLiked(prevLiked);
      setCount(prevCount);
    } else if (result.data.liked !== nextLiked) {
      // Local state was stale (e.g. the list this button renders in didn't
      // fetch personalized like state) — reconcile with what the server
      // actually did instead of compounding the drift.
      setLiked(result.data.liked);
      setCount(result.data.liked ? prevCount + 1 : prevCount - 1);
    }
  }

  const displayCount =
    count >= 1000
      ? (() => {
          const shortened = count / 1000;
          return `${shortened % 1 === 0 ? shortened : shortened.toFixed(1)}k`;
        })()
      : count;

  return (
    <button
      onClick={handleClick}
      className={
        className ??
        "flex flex-row items-center text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl"
      }
      style={liked ? { color: activeColor ?? "#f50707" } : undefined}
    >
      <Heart size={size} fill={liked ? "currentColor" : "none"} />
      <h1 className="text-body-lg ml-sm mr-sm">{displayCount}</h1>
    </button>
  );
}
