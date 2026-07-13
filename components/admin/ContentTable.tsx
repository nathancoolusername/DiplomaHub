"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteResource } from "@/app/lib/actions/resources";
import { deleteArticle } from "@/app/lib/actions/articles";
import { deleteDiscussion } from "@/app/lib/actions/discussions";
import {
  setResourcePublished,
  setArticlePublished,
  type AdminContentRow,
} from "@/app/lib/actions/admin";

type Tab = "resources" | "articles" | "discussions";

function contentLink(tab: Tab, item: AdminContentRow): string {
  if (tab === "resources") return `/resources/${item.id}`;
  if (tab === "articles") return `/articles/${item.slug}`;
  return `/community/${item.id}`;
}

export function ContentTable({
  resources,
  articles,
  discussions,
}: {
  resources: AdminContentRow[];
  articles: AdminContentRow[];
  discussions: AdminContentRow[];
}) {
  const [tab, setTab] = useState<Tab>("resources");
  const [items, setItems] = useState({ resources, articles, discussions });
  const [search, setSearch] = useState("");

  const current = items[tab];
  const query = search.toLowerCase();
  const filtered = current.filter(
    (item) =>
      item.title.toLowerCase().includes(query) ||
      item.author_display_name?.toLowerCase().includes(query),
  );

  function removeItem(id: string) {
    setItems((prev) => ({
      ...prev,
      [tab]: prev[tab].filter((i) => i.id !== id),
    }));
  }

  function updateItem(id: string, patch: Partial<AdminContentRow>) {
    setItems((prev) => ({
      ...prev,
      [tab]: prev[tab].map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }

  async function handleDelete(id: string) {
    if (!confirm(`Delete this ${tab.slice(0, -1)}?`)) return;
    const result =
      tab === "resources"
        ? await deleteResource(id)
        : tab === "articles"
          ? await deleteArticle(id)
          : await deleteDiscussion(id);
    if (result.success) removeItem(id);
    else alert(result.error);
  }

  async function handleTogglePublished(id: string, published: boolean) {
    const result =
      tab === "resources"
        ? await setResourcePublished(id, !published)
        : await setArticlePublished(id, !published);
    if (result.success) updateItem(id, { published: !published });
    else alert(result.error);
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-row gap-sm">
        {(["resources", "articles", "discussions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-md py-sm rounded-xl font-semibold capitalize cursor-pointer transition ${
              tab === t
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {t} ({items[t].length})
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by title or author..."
        className="border rounded-lg px-md py-sm w-full max-w-100"
      />

      <div className="overflow-x-auto bg-surface-container-lowest border-1 border-outline-variant rounded-xl">
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
            {filtered.map((item) => (
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
                      className={`px-md py-1 rounded-full text-label-md font-semibold cursor-pointer transition ${
                        item.published
                          ? "bg-primary-container text-on-primary"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
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
                    className="text-red-500 font-semibold cursor-pointer hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-md text-on-surface-variant" colSpan={6}>
                  No {tab} found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
