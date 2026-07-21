// components/SaveButton.tsx
"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { toggleSave } from "@/app/lib/actions/saved-items";

type SaveTarget =
  | { resource_id: string }
  | { article_id: string }
  | { discussion_id: string };

export function SaveButton({
  target,
  initiallySaved,
  path,
  className,
  activeColor,
  size = 30,
}: {
  target: SaveTarget;
  initiallySaved: boolean;
  path: string;
  className?: string;
  activeColor?: string;
  size?: number;
}) {
  const [saved, setSaved] = useState(initiallySaved);

  async function handleClick() {
    const prevSaved = saved;
    const nextSaved = !prevSaved;

    // Optimistic update — reflect the click instantly, revert if the
    // server call fails.
    setSaved(nextSaved);

    const result = await toggleSave(target, path);
    if (!result.success) {
      setSaved(prevSaved);
    } else if (result.data.saved !== nextSaved) {
      // Local state was stale — reconcile with what the server actually did.
      setSaved(result.data.saved);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={
        className ??
        "ml-auto text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl"
      }
      style={
        saved ? { color: activeColor ?? "var(--color-primary)" } : undefined
      }
    >
      <Bookmark size={size} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
