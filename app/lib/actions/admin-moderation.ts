"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createAdminClient } from "../supabase/admin";
import { getCurrentUserId } from "../get-current-user";
import { isAdmin } from "../admin";
import type { ActionResult } from "../types";

// Admin moderation. Every action checks the admin id on the server and then
// acts with the service-role client, so it never depends on row-level
// security letting an admin through (deletes used to fail quietly there).

async function requireAdminId(): Promise<string | null> {
  const id = await getCurrentUserId();
  return isAdmin(id) ? id : null;
}

const NOT_AUTHORIZED = { success: false, error: "Not authorized" } as const;

function refreshPublic() {
  revalidatePath("/resources");
  revalidatePath("/articles");
  revalidateTag("resources", "max");
  revalidatePath("/admin/content");
}

/** The storage path inside the `resources` bucket from a public file URL, or null. */
function resourceStoragePath(fileUrl: string | null): string | null {
  const marker = "/object/public/resources/";
  const i = fileUrl?.indexOf(marker) ?? -1;
  return i > -1 ? fileUrl!.slice(i + marker.length) : null;
}

export async function adminDeleteResource(id: string): Promise<ActionResult<null>> {
  if (!(await requireAdminId())) return NOT_AUTHORIZED;
  const admin = createAdminClient();
  const { data, error } = await admin.from("resources").delete().eq("id", id).select("id, file_url");
  if (error) return { success: false, error: error.message };
  if (!data?.length) return { success: false, error: "That resource is already gone" };
  const path = resourceStoragePath(data[0].file_url);
  if (path) await admin.storage.from("resources").remove([path]); // best effort: the row is already deleted
  refreshPublic();
  return { success: true, data: null };
}

export async function adminDeleteArticle(id: string): Promise<ActionResult<null>> {
  if (!(await requireAdminId())) return NOT_AUTHORIZED;
  const { data, error } = await createAdminClient().from("articles").delete().eq("id", id).select("id");
  if (error) return { success: false, error: error.message };
  if (!data?.length) return { success: false, error: "That article is already gone" };
  refreshPublic();
  return { success: true, data: null };
}

export async function adminDeleteDiscussion(id: string): Promise<ActionResult<null>> {
  if (!(await requireAdminId())) return NOT_AUTHORIZED;
  const { data, error } = await createAdminClient().from("discussions").delete().eq("id", id).select("id");
  if (error) return { success: false, error: error.message };
  if (!data?.length) return { success: false, error: "That discussion is already gone" };
  refreshPublic();
  return { success: true, data: null };
}

export async function adminDeleteComment(id: string): Promise<ActionResult<null>> {
  if (!(await requireAdminId())) return NOT_AUTHORIZED;
  const { data, error } = await createAdminClient().from("comments").delete().eq("id", id).select("id");
  if (error) return { success: false, error: error.message };
  if (!data?.length) return { success: false, error: "That comment is already gone" };
  refreshPublic();
  return { success: true, data: null };
}

export async function adminSetResourcePublished(id: string, published: boolean): Promise<ActionResult<null>> {
  if (!(await requireAdminId())) return NOT_AUTHORIZED;
  const { error } = await createAdminClient().from("resources").update({ published }).eq("id", id);
  if (error) return { success: false, error: error.message };
  refreshPublic();
  return { success: true, data: null };
}

export async function adminSetArticlePublished(id: string, published: boolean): Promise<ActionResult<null>> {
  if (!(await requireAdminId())) return NOT_AUTHORIZED;
  const { error } = await createAdminClient().from("articles").update({ published }).eq("id", id);
  if (error) return { success: false, error: error.message };
  refreshPublic();
  return { success: true, data: null };
}

export type AdminCommentRow = {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_display_name: string;
  target: { kind: "resource" | "article"; id: string; title: string; href: string } | null;
};

/** Newest comments first, with who wrote them and what they're on. */
export async function getAdminCommentsPage(filters: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<{ items: AdminCommentRow[]; totalCount: number }>> {
  if (!(await requireAdminId())) return NOT_AUTHORIZED;
  const admin = createAdminClient();
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? Math.min(filters.pageSize, 50) : 10;
  const search = filters.search?.trim().replace(/[%,()]/g, " ");

  let query = admin
    .from("comments")
    .select("id, content, created_at, user_id, resource_id, article_id, author:users(display_name)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (search) query = query.ilike("content", `%${search}%`);
  const { data, error, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) return { success: false, error: error.message };

  const rows = data ?? [];
  const resourceIds = [...new Set(rows.map((r) => r.resource_id).filter(Boolean))] as string[];
  const articleIds = [...new Set(rows.map((r) => r.article_id).filter(Boolean))] as string[];
  const [resources, articles] = await Promise.all([
    resourceIds.length ? admin.from("resources").select("id, title").in("id", resourceIds) : Promise.resolve({ data: [] }),
    articleIds.length ? admin.from("articles").select("id, title, slug").in("id", articleIds) : Promise.resolve({ data: [] }),
  ]);
  const resourceById = new Map((resources.data ?? []).map((r) => [r.id, r]));
  const articleById = new Map((articles.data ?? []).map((a) => [a.id, a]));

  const items = rows.map((r): AdminCommentRow => {
    const author = Array.isArray(r.author) ? r.author[0] : r.author;
    let target: AdminCommentRow["target"] = null;
    if (r.resource_id) {
      const t = resourceById.get(r.resource_id);
      if (t) target = { kind: "resource", id: t.id, title: t.title, href: `/resources/${t.id}` };
    } else if (r.article_id) {
      const t = articleById.get(r.article_id);
      if (t) target = { kind: "article", id: t.id, title: t.title, href: `/articles/${t.slug}` };
    }
    return {
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      author_id: r.user_id,
      author_display_name: author?.display_name ?? "Deleted user",
      target,
    };
  });
  return { success: true, data: { items, totalCount: count ?? 0 } };
}

/** Clears a user's bio and avatar (for abusive profile content). Their account and content stay. */
export async function adminClearProfile(userId: string): Promise<ActionResult<null>> {
  if (!(await requireAdminId())) return NOT_AUTHORIZED;
  const admin = createAdminClient();
  const { data: before } = await admin.from("users").select("avatar_url").eq("id", userId).maybeSingle();
  const { error } = await admin.from("users").update({ bio: null, avatar_url: null }).eq("id", userId);
  if (error) return { success: false, error: error.message };
  const marker = "/object/public/avatars/";
  const i = before?.avatar_url?.indexOf(marker) ?? -1;
  if (i > -1) await admin.storage.from("avatars").remove([before!.avatar_url!.slice(i + marker.length).split("?")[0]]);
  revalidatePath(`/profile/${userId}`);
  return { success: true, data: null };
}

// ── Waitlist ───────────────────────────────────────────────────────────

export async function adminRemoveWaitlistEntry(id: string): Promise<ActionResult<null>> {
  if (!(await requireAdminId())) return NOT_AUTHORIZED;
  const { error } = await createAdminClient().from("pro_waitlist").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/waitlist");
  return { success: true, data: null };
}

/** Every waitlist email as CSV text (email, signed-in, source, joined). */
export async function adminExportWaitlistCsv(): Promise<ActionResult<string>> {
  if (!(await requireAdminId())) return NOT_AUTHORIZED;
  const { data, error } = await createAdminClient()
    .from("pro_waitlist")
    .select("email, user_id, source, created_at")
    .order("created_at", { ascending: true })
    .limit(50000);
  if (error) return { success: false, error: error.message };
  // Quote every cell and neutralise spreadsheet formulas (=, +, -, @).
  const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
  const lines = ["email,signed_in,source,joined", ...(data ?? []).map((r) => [cell(r.email), r.user_id ? "yes" : "no", cell(r.source ?? ""), r.created_at].join(","))];
  return { success: true, data: lines.join("\n") };
}

export type ModerationCounts = { resources: number; articles: number; comments: number; discussions: number };

export async function getModerationCounts(): Promise<ActionResult<ModerationCounts>> {
  if (!(await requireAdminId())) return NOT_AUTHORIZED;
  const admin = createAdminClient();
  const count = async (table: string) => (await admin.from(table).select("*", { count: "exact", head: true })).count ?? 0;
  const [resources, articles, comments, discussions] = await Promise.all([count("resources"), count("articles"), count("comments"), count("discussions")]);
  return { success: true, data: { resources, articles, comments, discussions } };
}
