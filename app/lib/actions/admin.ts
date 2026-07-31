"use server";

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { revalidatePath } from "next/cache";
import { isAdmin } from "../admin";
import { createNotification } from "./notifications";
import { ROADMAP_TAG_ICON_NAMES } from "../roadmapTagIcons";
import type { ActionResult, RoadmapStatus, RoadmapItem, RoadmapTag } from "../types";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.id)) return null;
  return { supabase, user: user! };
}

export type AdminStats = {
  totalUsers: number;
  totalResources: number;
  totalArticles: number;
  totalDiscussions: number;
  unpublishedArticles: number;
  unpublishedResources: number;
};

export async function getAdminStats(): Promise<ActionResult<AdminStats>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };
  const { supabase } = ctx;

  const [
    { count: totalUsers },
    { count: totalResources },
    { count: totalArticles },
    { count: totalDiscussions },
    { count: unpublishedArticles },
    { count: unpublishedResources },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("resources").select("*", { count: "exact", head: true }),
    supabase.from("articles").select("*", { count: "exact", head: true }),
    supabase.from("discussions").select("*", { count: "exact", head: true }),
    supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("published", false),
    supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("published", false),
  ]);

  return {
    success: true,
    data: {
      totalUsers: totalUsers ?? 0,
      totalResources: totalResources ?? 0,
      totalArticles: totalArticles ?? 0,
      totalDiscussions: totalDiscussions ?? 0,
      unpublishedArticles: unpublishedArticles ?? 0,
      unpublishedResources: unpublishedResources ?? 0,
    },
  };
}

export type AdminUserRow = {
  id: string;
  display_name: string;
  email: string;
  points: number;
  is_pro: boolean;
  author_trust_score: number;
  ib_year: string | null;
  avatar_url: string | null;
  created_at: string;
};

export async function getUsersPage(filters: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<{ items: AdminUserRow[]; totalCount: number }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize =
    filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = filters.search?.trim();

  let query = ctx.supabase
    .from("users")
    .select(
      "id, display_name, email, points, is_pro, author_trust_score, ib_year, avatar_url, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) return { success: false, error: error.message };
  return {
    success: true,
    data: { items: data ?? [], totalCount: count ?? 0 },
  };
}

export async function deleteUserAsAdmin(
  targetUserId: string,
): Promise<ActionResult<null>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  // Refuse to delete any hardcoded admin account (including the caller's
  // own) — ADMIN_USER_IDS is a fixed array in source, so deleting that auth
  // user would just brick admin access until a redeploy, not actually
  // remove them from the admin list.
  if (isAdmin(targetUserId)) {
    return { success: false, error: "Cannot delete an admin account" };
  }

  // Cascades to all their resources/articles/discussions/comments/etc at
  // the DB level (ON DELETE CASCADE) — see PROJECT_CONTEXT.md.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(targetUserId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/users");
  return { success: true, data: null };
}

export async function updateAuthorTrustScore(
  userId: string,
  score: number,
): Promise<ActionResult<null>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  if (!Number.isInteger(score) || score < 0 || score > 100) {
    return { success: false, error: "Score must be an integer between 0 and 100" };
  }

  // author_trust_score is deliberately excluded from the client-writable
  // column grant (only display_name/ib_year/bio/avatar_url are) — the
  // regular session client would get a permission-denied error, so this
  // needs the service-role client, gated by the isAdmin check above.
  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ author_trust_score: score })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  await createNotification({
    userId,
    actorId: ctx.user.id,
    type: "admin_trust_score",
    message: `Your author trust score was updated to ${score}`,
    link: `/profile/${userId}`,
  });

  revalidatePath("/admin/users");
  return { success: true, data: null };
}

export async function setUserPro(
  userId: string,
  isPro: boolean,
): Promise<ActionResult<null>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  // Same column-grant restriction as author_trust_score — is_pro is
  // normally only ever set by the award_points() trigger.
  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ is_pro: isPro })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  if (isPro) {
    await createNotification({
      userId,
      actorId: ctx.user.id,
      type: "admin_pro_upgrade",
      message: "You've been upgraded to Diploma Pro!",
      link: `/profile/${userId}`,
    });
  }

  revalidatePath("/admin/users");
  return { success: true, data: null };
}

export type AdminContentRow = {
  id: string;
  title: string;
  slug?: string;
  author_id: string;
  author_display_name: string;
  created_at: string;
  published?: boolean;
  community_trust?: number;
  like_count: number;
};

type AdminContentFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
};

async function getAdminContentPage(
  table: "resources" | "articles" | "discussions",
  selectCols: string,
  filters: AdminContentFilters,
): Promise<ActionResult<{ items: AdminContentRow[]; totalCount: number }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize =
    filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = filters.search?.trim();

  let query = ctx.supabase
    .from(table)
    .select(selectCols, { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("title", `%${search}%`);

  const { data, error, count } = await query.range(from, to);
  if (error) return { success: false, error: error.message };

  type RawRow = Omit<AdminContentRow, "author_display_name"> & {
    author: { display_name: string } | { display_name: string }[] | null;
  };

  const items = ((data ?? []) as unknown as RawRow[]).map((r) => ({
    ...r,
    author_display_name:
      (Array.isArray(r.author)
        ? r.author[0]?.display_name
        : r.author?.display_name) ?? "Deleted user",
  }));

  return { success: true, data: { items, totalCount: count ?? 0 } };
}

export async function getAdminResourcesPage(filters: AdminContentFilters) {
  return getAdminContentPage(
    "resources",
    "id, title, author_id, created_at, published, community_trust, like_count, author:users(display_name)",
    filters,
  );
}

export async function getAdminArticlesPage(filters: AdminContentFilters) {
  return getAdminContentPage(
    "articles",
    "id, title, slug, author_id, created_at, published, like_count, author:users(display_name)",
    filters,
  );
}

export async function getAdminDiscussionsPage(filters: AdminContentFilters) {
  return getAdminContentPage(
    "discussions",
    "id, title, author_id, created_at, like_count, author:users(display_name)",
    filters,
  );
}

export async function getAdminContentCounts(): Promise<
  ActionResult<{ resources: number; articles: number; discussions: number }>
> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  const [{ count: resources }, { count: articles }, { count: discussions }] =
    await Promise.all([
      ctx.supabase.from("resources").select("*", { count: "exact", head: true }),
      ctx.supabase.from("articles").select("*", { count: "exact", head: true }),
      ctx.supabase
        .from("discussions")
        .select("*", { count: "exact", head: true }),
    ]);

  return {
    success: true,
    data: {
      resources: resources ?? 0,
      articles: articles ?? 0,
      discussions: discussions ?? 0,
    },
  };
}

export async function setResourcePublished(
  resourceId: string,
  published: boolean,
): Promise<ActionResult<null>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  const { error } = await ctx.supabase
    .from("resources")
    .update({ published })
    .eq("id", resourceId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/content");
  revalidatePath("/resources");
  return { success: true, data: null };
}

export async function setArticlePublished(
  articleId: string,
  published: boolean,
): Promise<ActionResult<null>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  const { error } = await ctx.supabase
    .from("articles")
    .update({ published })
    .eq("id", articleId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/content");
  revalidatePath("/articles");
  return { success: true, data: null };
}

export type AdminFeedbackRow = {
  id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  author_display_name: string | null;
};

export async function getFeedbackPage(filters: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<{ items: AdminFeedbackRow[]; totalCount: number }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize =
    filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 10;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const search = filters.search?.trim();

  // `feedback` has no select policy at all (submitters shouldn't be able to
  // read each other's feedback) — the regular session client would just get
  // an empty result under RLS, so this needs the service-role client.
  const admin = createAdminClient();
  let query = admin
    .from("feedback")
    .select("id, user_id, content, created_at, author:users(display_name)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (search) query = query.ilike("content", `%${search}%`);

  const { data, error, count } = await query.range(from, to);
  if (error) return { success: false, error: error.message };

  type RawFeedbackRow = {
    id: string;
    user_id: string | null;
    content: string;
    created_at: string;
    author: { display_name: string } | { display_name: string }[] | null;
  };

  const items = ((data ?? []) as unknown as RawFeedbackRow[]).map((f) => ({
    id: f.id,
    user_id: f.user_id,
    content: f.content,
    created_at: f.created_at,
    author_display_name: Array.isArray(f.author)
      ? (f.author[0]?.display_name ?? null)
      : (f.author?.display_name ?? null),
  }));

  return { success: true, data: { items, totalCount: count ?? 0 } };
}

export async function deleteFeedback(
  feedbackId: string,
): Promise<ActionResult<null>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  const admin = createAdminClient();
  const { error } = await admin.from("feedback").delete().eq("id", feedbackId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/feedback");
  return { success: true, data: null };
}

export type RoadmapItemInput = {
  title: string;
  status: RoadmapStatus;
  completion_percentage: number | null;
  release_label: string | null;
  description: string | null;
  tags: RoadmapTag[];
  sort_order: number;
};

const ROADMAP_STATUSES: RoadmapStatus[] = ["completed", "in_progress", "planned"];

function validateRoadmapInput(
  input: RoadmapItemInput,
): { error: string } | { value: RoadmapItemInput } {
  const title = input.title?.trim();
  if (!title) return { error: "Title is required" };
  if (title.length > 200) return { error: "Title must be under 200 characters" };

  if (!ROADMAP_STATUSES.includes(input.status)) {
    return { error: "Invalid status" };
  }

  if (
    input.completion_percentage !== null &&
    (!Number.isInteger(input.completion_percentage) ||
      input.completion_percentage < 0 ||
      input.completion_percentage > 100)
  ) {
    return { error: "Percentage must be an integer between 0 and 100" };
  }

  const releaseLabel = input.release_label?.trim() || null;
  if (releaseLabel && releaseLabel.length > 100) {
    return { error: "Release label must be under 100 characters" };
  }

  const description = input.description?.trim() || null;
  if (description && description.length > 2000) {
    return { error: "Description must be under 2000 characters" };
  }

  if (!Array.isArray(input.tags) || input.tags.length > 10) {
    return { error: "A roadmap item can have at most 10 tags" };
  }
  for (const tag of input.tags) {
    if (!tag.label?.trim() || tag.label.trim().length > 50) {
      return { error: "Each tag label must be 1-50 characters" };
    }
    if (!ROADMAP_TAG_ICON_NAMES.includes(tag.icon as (typeof ROADMAP_TAG_ICON_NAMES)[number])) {
      return { error: `Unknown tag icon: ${tag.icon}` };
    }
  }

  if (!Number.isInteger(input.sort_order)) {
    return { error: "Sort order must be an integer" };
  }

  return {
    value: {
      title,
      status: input.status,
      completion_percentage:
        input.status === "in_progress" ? input.completion_percentage : null,
      release_label: releaseLabel,
      description,
      tags: input.tags.map((t) => ({ label: t.label.trim(), icon: t.icon })),
      sort_order: input.sort_order,
    },
  };
}

// roadmap_items has no client-writable grant at all (it's public-read,
// admin-write with no author to scope RLS to) — same shape as the
// feedback table, so writes go through the service-role client.
export async function createRoadmapItem(
  input: RoadmapItemInput,
): Promise<ActionResult<RoadmapItem>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  const fields = validateRoadmapInput(input);
  if ("error" in fields) return { success: false, error: fields.error };

  const baseSlug = fields.value.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  // Mirrors the article slug pattern — a short random suffix avoids
  // collisions between items with the same/similar title.
  const id = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("roadmap_items")
    .insert({ id, ...fields.value })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/roadmap");
  revalidatePath("/roadmap");
  return { success: true, data };
}

export async function updateRoadmapItem(
  id: string,
  input: RoadmapItemInput,
): Promise<ActionResult<null>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  const fields = validateRoadmapInput(input);
  if ("error" in fields) return { success: false, error: fields.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("roadmap_items")
    .update(fields.value)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/roadmap");
  revalidatePath("/roadmap");
  return { success: true, data: null };
}

export async function deleteRoadmapItem(id: string): Promise<ActionResult<null>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  const admin = createAdminClient();
  const { error } = await admin.from("roadmap_items").delete().eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/roadmap");
  revalidatePath("/roadmap");
  return { success: true, data: null };
}
