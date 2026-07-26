"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { deleteResource } from "@/app/lib/actions/resources";
import { deleteArticle } from "@/app/lib/actions/articles";
import { deleteDiscussion } from "@/app/lib/actions/discussions";
import {
  setResourcePublished,
  setArticlePublished,
  getAdminResourcesPage,
  getAdminArticlesPage,
  getAdminDiscussionsPage,
  type AdminContentRow,
} from "@/app/lib/actions/admin";
import { Spinner } from "@/components/spinner";
import { Pagination } from "@/components/Pagination";

type Tab = "resources" | "articles" | "discussions";
type Counts = Record<Tab, number>;

const PAGE_SIZE = 10;

const FETCH_PAGE: Record<
  Tab,
  (filters: {
    search?: string;
    page?: number;
    pageSize?: number;
  }) => ReturnType<typeof getAdminResourcesPage>
> = {
  resources: getAdminResourcesPage,
  articles: getAdminArticlesPage,
  discussions: getAdminDiscussionsPage,
};

function contentLink(tab: Tab, item: AdminContentRow): string {
  if (tab === "resources") return `/resources/${item.id}`;
  if (tab === "articles") return `/articles/${item.slug}`;
  return `/community/${item.id}`;
}

export function ContentTable({
  initialItems,
  initialTotalCount,
  initialCounts,
}: {
  initialItems: AdminContentRow[];
  initialTotalCount: number;
  initialCounts: Counts;
}) {
  const [tab, setTab] = useState<Tab>("resources");
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [items, setItems] = useState(initialItems);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function handleTabChange(t: Tab) {
    setTab(t);
    setSearch("");
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotalCount((prev) => prev - 1);
    setCounts((prev) => ({ ...prev, [tab]: prev[tab] - 1 }));
  }

  function updateItem(id: string, patch: Partial<AdminContentRow>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  async function handleDelete(id: string) {
    if (!confirm(`Delete this ${tab.slice(0, -1)}?`)) return;
    setPendingId(id);
    const result =
      tab === "resources"
        ? await deleteResource(id)
        : tab === "articles"
          ? await deleteArticle(id)
          : await deleteDiscussion(id);
    if (result.success) removeItem(id);
    else {
      alert(result.error);
      setPendingId(null);
    }
  }

  async function handleTogglePublished(id: string, published: boolean) {
    setPendingId(id);
    const result =
      tab === "resources"
        ? await setResourcePublished(id, !published)
        : await setArticlePublished(id, !published);
    if (result.success) updateItem(id, { published: !published });
    else alert(result.error);
    setPendingId(null);
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
        const result = await FETCH_PAGE[tab]({
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
  }, [tab, search, page]);

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-row gap-sm">
        {(["resources", "articles", "discussions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={`px-md py-sm rounded-xl font-semibold capitalize cursor-pointer transition ${
              tab === t
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search by title..."
        className="border rounded-lg px-md py-sm w-full max-w-100"
      />

      <div
        className={`overflow-x-auto bg-surface-container-lowest border-1 border-outline-variant rounded-xl transition-opacity ${loading ? "opacity-50" : ""}`}
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-1 border-outline-variant text-on-surface-variant text-label-md uppercase">
              <th className="p-md">Title</th>
              <th className="p-md">Author</th>
              <th className="p-md">Likes</th>
              {tab === "resources" && <th className="p-md">Trust</th>}
              {tab !== "discussions" && <th className="p-md">Status</th>}
              <th className="p-md">Created</th>
              <th className="p-md">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b-1 border-outline-variant last:border-b-0"
              >
                <td className="p-md font-bold">
                  <Link
                    href={contentLink(tab, item)}
                    className="text-primary hover:underline"
                  >
                    {item.title}
                  </Link>
                </td>
                <td className="p-md">
                  <Link
                    href={`/profile/${item.author_id}`}
                    className="text-primary hover:underline"
                  >
                    {item.author_display_name}
                  </Link>
                </td>
                <td className="p-md">{item.like_count}</td>
                {tab === "resources" && (
                  <td className="p-md">{item.community_trust}%</td>
                )}
                {tab !== "discussions" && (
                  <td className="p-md">
                    <button
                      onClick={() =>
                        handleTogglePublished(item.id, !!item.published)
                      }
                      disabled={pendingId === item.id}
                      className={`px-md py-1 rounded-full text-label-md font-semibold cursor-pointer transition disabled:opacity-50 inline-flex items-center gap-xs ${
                        item.published
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {pendingId === item.id && <Spinner size={12} />}
                      {item.published ? "Published" : "Unpublished"}
                    </button>
                  </td>
                )}
                <td className="p-md text-on-surface-variant text-label-md">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="p-md">
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={pendingId === item.id}
                    className="text-red-500 font-semibold cursor-pointer hover:underline disabled:opacity-50 disabled:no-underline inline-flex items-center gap-xs"
                  >
                    {pendingId === item.id && <Spinner size={14} />}
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td className="p-md text-on-surface-variant" colSpan={6}>
                  No {tab} found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
