"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EyeOff, Eye, Search, Trash2 } from "lucide-react";
import {
  adminDeleteArticle,
  adminDeleteComment,
  adminDeleteDiscussion,
  adminDeleteResource,
  adminSetArticlePublished,
  adminSetResourcePublished,
  getAdminCommentsPage,
  type AdminCommentRow,
  type ModerationCounts,
} from "@/app/lib/actions/admin-moderation";
import {
  getAdminArticlesPage,
  getAdminDiscussionsPage,
  getAdminResourcesPage,
  type AdminContentRow,
} from "@/app/lib/actions/admin";
import { Dialog } from "@/components/shared/Dialog";
import { Pagination } from "@/components/Pagination";
import { Spinner } from "@/components/spinner";

type Tab = "resources" | "articles" | "comments" | "discussions";
const PAGE_SIZE = 10;
const LABELS: Record<Tab, { plural: string; singular: string }> = {
  resources: { plural: "Resources", singular: "resource" },
  articles: { plural: "Articles", singular: "article" },
  comments: { plural: "Comments", singular: "comment" },
  discussions: { plural: "Discussions", singular: "discussion" },
};
const th = "px-md py-sm text-label-sm font-semibold text-on-surface-variant uppercase";

type Row = { id: string; kind: "content"; item: AdminContentRow } | { id: string; kind: "comment"; item: AdminCommentRow };

function contentLink(tab: Tab, item: AdminContentRow): string {
  if (tab === "resources") return `/resources/${item.id}`;
  if (tab === "articles") return `/articles/${item.slug}`;
  return `/profile/${item.author_id}`;
}

async function fetchRows(tab: Tab, search: string, page: number): Promise<{ rows: Row[]; total: number } | { error: string }> {
  if (tab === "comments") {
    const r = await getAdminCommentsPage({ search, page, pageSize: PAGE_SIZE });
    return r.success ? { rows: r.data.items.map((item) => ({ id: item.id, kind: "comment" as const, item })), total: r.data.totalCount } : { error: r.error };
  }
  const load = tab === "resources" ? getAdminResourcesPage : tab === "articles" ? getAdminArticlesPage : getAdminDiscussionsPage;
  const r = await load({ search, page, pageSize: PAGE_SIZE });
  return r.success ? { rows: r.data.items.map((item) => ({ id: item.id, kind: "content" as const, item })), total: r.data.totalCount } : { error: r.error };
}

/** Moderation: find user content, hide it, or delete it for good. */
export function ModerationTable({ initialCounts }: { initialCounts: ModerationCounts }) {
  const [tab, setTab] = useState<Tab>("resources");
  const [counts, setCounts] = useState(initialCounts);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Row | null>(null);

  // Debounced fetch: Server Actions have no abort signal, so stale answers are dropped instead.
  const first = useRef(true);
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(
      async () => {
        setLoading(true);
        const res = await fetchRows(tab, search, page);
        if (cancelled) return;
        if ("error" in res) setError(res.error);
        else {
          setError(null);
          setRows(res.rows);
          setTotal(res.total);
        }
        setLoading(false);
      },
      first.current ? 0 : 300,
    );
    first.current = false;
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [tab, search, page]);

  async function togglePublished(row: Row & { kind: "content" }) {
    setBusy(row.id);
    const next = !row.item.published;
    const res = tab === "resources" ? await adminSetResourcePublished(row.id, next) : await adminSetArticlePublished(row.id, next);
    if (res.success) setRows((rs) => rs.map((r) => (r.id === row.id && r.kind === "content" ? { ...r, item: { ...r.item, published: next } } : r)));
    else setError(res.error);
    setBusy(null);
  }

  async function confirmDelete() {
    const row = confirming;
    if (!row) return;
    setBusy(row.id);
    const del = { resources: adminDeleteResource, articles: adminDeleteArticle, comments: adminDeleteComment, discussions: adminDeleteDiscussion }[tab];
    const res = await del(row.id);
    setBusy(null);
    setConfirming(null);
    if (res.success) {
      setRows((rs) => rs.filter((r) => r.id !== row.id));
      setTotal((n) => n - 1);
      setCounts((c) => ({ ...c, [tab]: c[tab] - 1 }));
      setError(null);
    } else setError(res.error);
  }

  const canHide = tab === "resources" || tab === "articles";

  return (
    <div className="flex flex-col gap-md">
      <div role="tablist" aria-label="Content type" className="flex flex-wrap gap-xs">
        {(Object.keys(LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => {
              setTab(t);
              setSearch("");
              setPage(1);
            }}
            className={`rounded-full px-md py-xs text-label-md font-semibold cursor-pointer transition-colors ${
              tab === t ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            {LABELS[t].plural} <span className="tabular-nums opacity-80">({counts[t].toLocaleString()})</span>
          </button>
        ))}
      </div>

      <label className="relative w-full max-w-100">
        <span className="sr-only">Search</span>
        <Search size={16} className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={tab === "comments" ? "Search comment text…" : "Search by title…"}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-9 pr-md py-sm text-body-md"
        />
      </label>

      {error && (
        <p role="alert" className="text-label-md text-error">
          {error}
        </p>
      )}

      <div className={`overflow-x-auto rounded-2xl border border-outline-variant bg-surface-container-lowest transition-opacity ${loading ? "opacity-50" : ""}`}>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className={th}>{tab === "comments" ? "Comment" : "Title"}</th>
              <th className={th}>Author</th>
              {tab === "comments" ? <th className={th}>On</th> : <th className={th}>Likes</th>}
              {canHide && <th className={th}>Status</th>}
              <th className={th}>Created</th>
              <th className={th}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const c = row.kind === "content" ? row.item : null;
              const m = row.kind === "comment" ? row.item : null;
              return (
                <tr key={row.id} className="border-b border-outline-variant last:border-b-0 align-top">
                  <td className="px-md py-sm max-w-120">
                    {c ? (
                      <Link href={contentLink(tab, c)} className="font-semibold text-primary hover:underline">
                        {c.title}
                      </Link>
                    ) : (
                      <p className="text-body-md text-on-surface whitespace-pre-wrap break-words line-clamp-4">{m!.content}</p>
                    )}
                  </td>
                  <td className="px-md py-sm">
                    <Link href={`/profile/${(c ?? m!).author_id}`} className="text-primary hover:underline">
                      {(c ?? m!).author_display_name}
                    </Link>
                  </td>
                  {m ? (
                    <td className="px-md py-sm text-body-md">
                      {m.target ? (
                        <Link href={m.target.href} className="text-primary hover:underline">
                          {m.target.title}
                        </Link>
                      ) : (
                        <span className="text-on-surface-variant">Deleted</span>
                      )}
                    </td>
                  ) : (
                    <td className="px-md py-sm text-body-md tabular-nums">{c!.like_count}</td>
                  )}
                  {canHide && c && (
                    <td className="px-md py-sm">
                      <button
                        type="button"
                        onClick={() => togglePublished(row as Row & { kind: "content" })}
                        disabled={busy === row.id}
                        className={`inline-flex items-center gap-xs rounded-full px-md py-px text-label-md font-semibold cursor-pointer disabled:opacity-50 ${
                          c.published ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"
                        }`}
                        title={c.published ? "Hide from the site" : "Publish"}
                      >
                        {c.published ? <Eye size={12} aria-hidden="true" /> : <EyeOff size={12} aria-hidden="true" />}
                        {c.published ? "Published" : "Hidden"}
                      </button>
                    </td>
                  )}
                  <td className="px-md py-sm text-label-md text-on-surface-variant whitespace-nowrap">{new Date((c ?? m!).created_at).toLocaleDateString()}</td>
                  <td className="px-md py-sm text-right">
                    <button
                      type="button"
                      onClick={() => setConfirming(row)}
                      disabled={busy === row.id}
                      aria-label={`Delete this ${LABELS[tab].singular}`}
                      className="inline-flex items-center gap-xs rounded-lg px-sm py-xs text-label-md font-semibold text-error hover:bg-error-container disabled:opacity-50 cursor-pointer"
                    >
                      {busy === row.id ? <Spinner size={14} /> : <Trash2 size={14} aria-hidden="true" />} Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && rows.length === 0 && (
              <tr>
                <td className="px-md py-lg text-center text-on-surface-variant" colSpan={6}>
                  No {LABELS[tab].plural.toLowerCase()} found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalCount={total} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {confirming && (
        <Dialog
          title={`Delete this ${LABELS[tab].singular}?`}
          onClose={() => setConfirming(null)}
          width="max-w-110"
          footer={
            <>
              <button type="button" onClick={() => setConfirming(null)} className="rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy !== null}
                className="rounded-lg bg-error text-on-error px-md py-sm text-label-md font-semibold hover:opacity-90 disabled:opacity-60 cursor-pointer"
              >
                Delete for good
              </button>
            </>
          }
        >
          <p className="text-body-md text-on-surface-variant">
            {confirming.kind === "comment"
              ? `“${confirming.item.content.slice(0, 160)}${confirming.item.content.length > 160 ? "…" : ""}” by ${confirming.item.author_display_name}.`
              : `“${confirming.item.title}” by ${confirming.item.author_display_name}.`}{" "}
            This can&apos;t be undone.
            {tab === "resources" && " The uploaded file is removed too."}
          </p>
        </Dialog>
      )}
    </div>
  );
}
