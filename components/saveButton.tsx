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
}: {
  target: SaveTarget;
  initiallySaved: boolean;
  path: string;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await toggleSave(target, path);
    if (result.success) setSaved(result.data.saved);
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="ml-auto text-on-surface-variant transition hover:text-primary hover:bg-surface-container p-sm rounded-xl disabled:opacity-50 "
    >
      <Bookmark fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
