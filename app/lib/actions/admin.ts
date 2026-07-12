"use server";

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { revalidatePath } from "next/cache";
import { isAdmin } from "../admin";
import type { ActionResult } from "../types";

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

export async function getAllUsersForAdmin(): Promise<
  ActionResult<AdminUserRow[]>
> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  const { data, error } = await ctx.supabase
    .from("users")
    .select(
      "id, display_name, email, points, is_pro, author_trust_score, ib_year, avatar_url, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
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
  revalidatePath("/admin/users");
  return { success: true, data: null };
}

export type AdminContentRow = {
  id: string;
  title: string;
  author_id: string;
  author_display_name: string;
  created_at: string;
  published?: boolean;
  community_trust?: number;
  like_count: number;
};

export async function getAllContentForAdmin(): Promise<
  ActionResult<{
    resources: AdminContentRow[];
    articles: AdminContentRow[];
    discussions: AdminContentRow[];
  }>
> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };
  const { supabase } = ctx;

  const [
    { data: resources, error: resourcesError },
    { data: articles, error: articlesError },
    { data: discussions, error: discussionsError },
  ] = await Promise.all([
    supabase
      .from("resources")
      .select(
        "id, title, author_id, created_at, published, community_trust, like_count, author:users(display_name)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("articles")
      .select(
        "id, title, author_id, created_at, published, like_count, author:users(display_name)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("discussions")
      .select(
        "id, title, author_id, created_at, like_count, author:users(display_name)",
      )
      .order("created_at", { ascending: false }),
  ]);

  if (resourcesError) return { success: false, error: resourcesError.message };
  if (articlesError) return { success: false, error: articlesError.message };
  if (discussionsError)
    return { success: false, error: discussionsError.message };

  type RawRow = Omit<AdminContentRow, "author_display_name"> & {
    author: { display_name: string } | { display_name: string }[] | null;
  };

  const flatten = (rows: RawRow[] | null): AdminContentRow[] =>
    (rows ?? []).map((r) => ({
      ...r,
      author_display_name:
        (Array.isArray(r.author) ? r.author[0]?.display_name : r.author?.display_name) ??
        "Deleted user",
    }));

  return {
    success: true,
    data: {
      resources: flatten(resources),
      articles: flatten(articles),
      discussions: flatten(discussions),
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
