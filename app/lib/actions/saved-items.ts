// lib/actions/saved-items.ts
"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { checkRateLimit } from "../ratelimit";
import type { ActionResult, Resource, Article } from "../types";

type SaveTarget = { resource_id: string } | { article_id: string };

export async function toggleSave(
  target: SaveTarget,
  path: string,
): Promise<ActionResult<{ saved: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Log in to save items" };

  const rateLimit = await checkRateLimit("toggle", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const { data: existing } = await supabase
    .from("saved_items")
    .select("id")
    .match({ user_id: user.id, ...target })
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    revalidatePath(path);
    return { success: true, data: { saved: false } };
  } else {
    const { error } = await supabase
      .from("saved_items")
      .insert({ user_id: user.id, ...target });
    if (error) return { success: false, error: error.message };
    revalidatePath(path);
    return { success: true, data: { saved: true } };
  }
}

// Discussions were deliberately dropped from this query (2026-09 cleanup) —
// ProfileInfo.tsx, the only caller of getSavedItems(), never rendered a
// "Saved Discussions" list (removed along with /community), so fetching
// and resolving them here was pure wasted work on every profile-page load:
// a join, a follow-up top_reply lookup, and an extra likes query, none of
// it ever reaching the screen.
export async function getSavedItems(): Promise<
  ActionResult<{
    resources: Resource[];
    articles: Article[];
  }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { data, error } = await supabase
    .from("saved_items")
    .select(
      `
      created_at,
      resource:resources(*, author:users(display_name, is_pro, ib_year, avatar_url)),
      article:articles(*, author:users(display_name, is_pro, ib_year, avatar_url))
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  const resources = data
    .filter((d) => d.resource)
    .map((d) => (Array.isArray(d.resource) ? d.resource[0] : d.resource));
  const articles = data
    .filter((d) => d.article)
    .map((d) => (Array.isArray(d.article) ? d.article[0] : d.article));

  function normalize<T extends { author: unknown }>(row: T) {
    return {
      ...row,
      author: Array.isArray(row.author) ? row.author[0] : row.author,
    };
  }

  // Every item here is, by definition, already saved by this user — only
  // isLiked needs a real per-item lookup.
  const [{ data: likedResources }, { data: likedArticles }] = await Promise.all([
    resources.length
      ? supabase
          .from("likes")
          .select("resource_id")
          .eq("user_id", user.id)
          .in("resource_id", resources.map((r) => r.id))
      : Promise.resolve({ data: [] as { resource_id: string }[] }),
    articles.length
      ? supabase
          .from("likes")
          .select("article_id")
          .eq("user_id", user.id)
          .in("article_id", articles.map((a) => a.id))
      : Promise.resolve({ data: [] as { article_id: string }[] }),
  ]);

  const likedResourceIds = new Set(likedResources?.map((l) => l.resource_id));
  const likedArticleIds = new Set(likedArticles?.map((l) => l.article_id));

  return {
    success: true,
    data: {
      resources: resources.map((r) => ({
        ...normalize(r),
        isSaved: true,
        isLiked: likedResourceIds.has(r.id),
      })),
      articles: articles.map((a) => ({
        ...normalize(a),
        isSaved: true,
        isLiked: likedArticleIds.has(a.id),
      })),
    },
  };
}
