"use client";

import { useState } from "react";
import { deleteFeedback, type AdminFeedbackRow } from "@/app/lib/actions/admin";
import { formatRelativeTime } from "@/app/lib/relativeTime";
import { Spinner } from "@/components/spinner";

export function FeedbackTable({ feedback }: { feedback: AdminFeedbackRow[] }) {
  const [items, setItems] = useState(feedback);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const query = search.toLowerCase();
  const filtered = items.filter(
    (f) =>
      f.content.toLowerCase().includes(query) ||
      f.author_display_name?.toLowerCase().includes(query),
  );

  async function handleDelete(id: string) {
    if (!confirm("Delete this feedback?")) return;
    setDeletingId(id);
    const result = await deleteFeedback(id);
    if (result.success) {
      setItems((prev) => prev.filter((f) => f.id !== id));
    } else {
      alert(result.error);
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-md">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search feedback or submitter..."
        className="border rounded-lg px-md py-sm w-full max-w-100"
      />

      {filtered.length === 0 && (
        <p className="text-on-surface-variant">No feedback yet.</p>
      )}

      <div className="flex flex-col gap-md">
        {filtered.map((f) => (
          <div
            key={f.id}
            className="bg-surface-container-lowest border-1 border-outline-variant rounded-xl p-lg flex flex-col gap-sm"
          >
            <div className="flex flex-row justify-between items-center">
              <p className="font-bold text-body-md text-primary">
                {f.author_display_name ?? "Anonymous"}
              </p>
              <div className="flex flex-row items-center gap-md">
                <p className="text-on-surface-variant text-label-md">
                  {formatRelativeTime(f.created_at)}
                </p>
                <button
                  onClick={() => handleDelete(f.id)}
                  disabled={deletingId === f.id}
                  className="text-red-500 font-semibold cursor-pointer hover:underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-xs"
                >
                  {deletingId === f.id && <Spinner size={14} />}
                  Delete
                </button>
              </div>
            </div>
            <p className="text-body-lg whitespace-pre-wrap">{f.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
