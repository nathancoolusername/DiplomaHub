"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteFeedback,
  getFeedbackPage,
  type AdminFeedbackRow,
} from "@/app/lib/actions/admin";
import { formatRelativeTime } from "@/app/lib/relativeTime";
import { Spinner } from "@/components/spinner";
import { Pagination } from "@/components/Pagination";

const PAGE_SIZE = 10;

export function FeedbackTable({
  initialItems,
  initialTotalCount,
}: {
  initialItems: AdminFeedbackRow[];
  initialTotalCount: number;
}) {
  const [items, setItems] = useState(initialItems);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this feedback?")) return;
    setDeletingId(id);
    const result = await deleteFeedback(id);
    if (result.success) {
      setItems((prev) => prev.filter((f) => f.id !== id));
      setTotalCount((prev) => prev - 1);
    } else {
      alert(result.error);
      setDeletingId(null);
    }
  }

  // Same debounced-fetch shape as the public resource/article/discussion
  // grids — see resources-grid.tsx for why this is debounced rather than
  // cancelled via AbortController (Server Actions expose no signal).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      async function fetchPage() {
        setLoading(true);
        const result = await getFeedbackPage({
          search,
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        if (result.success) {
          setItems(result.data.items);
          setTotalCount(result.data.totalCount);
        }
        setLoading(false);
      }
      fetchPage();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [search, page]);

  return (
    <div className="flex flex-col gap-md">
      <input
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search feedback..."
        className="border rounded-lg px-md py-sm w-full max-w-100"
      />

      {!loading && items.length === 0 && (
        <p className="text-on-surface-variant">No feedback yet.</p>
      )}

      <div
        className={`flex flex-col gap-md transition-opacity ${loading ? "opacity-50" : ""}`}
      >
        {items.map((f) => (
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
      <Pagination
        page={page}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
