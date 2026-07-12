// lib/actions/saved-items.ts
"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "../types";

type SaveTarget =
  | { resource_id: string }
  | { article_id: string }
  | { discussion_id: string };

export async function toggleSave(
  target: SaveTarget,
  path: string,
): Promise<ActionResult<{ saved: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Log in to save items" };

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

export async function getSavedItems(): Promise<
  ActionResult<{
    resources: any[];
    articles: any[];
    discussions: any[];
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
      resource:resources(*, author:users(display_name, is_pro, ib_year)),
      article:articles(*, author:users(display_name, is_pro, ib_year)),
      discussion:discussions(*, author:users(display_name, is_pro, ib_year))
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
  const discussions = data
    .filter((d) => d.discussion)
    .map((d) => (Array.isArray(d.discussion) ? d.discussion[0] : d.discussion));

  const normalize = (row: any) => ({
    ...row,
    author: Array.isArray(row.author) ? row.author[0] : row.author,
  });

  // `top_reply` is a FK (uuid) pointing at discussion_replies.id, not the
  // reply text itself — resolve it to actual content for display.
  const topReplyIds = discussions
    .map((d) => d.top_reply)
    .filter((id): id is string => !!id);

  const { data: topReplies } = topReplyIds.length
    ? await supabase
        .from("discussion_replies")
        .select("id, content")
        .in("id", topReplyIds)
    : { data: [] as { id: string; content: string }[] };

  const topReplyContent = new Map(topReplies?.map((r) => [r.id, r.content]));

  // Every item here is, by definition, already saved by this user — only
  // isLiked needs a real per-item lookup.
  const [{ data: likedResources }, { data: likedArticles }, { data: likedDiscussions }] =
    await Promise.all([
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
      discussions.length
        ? supabase
            .from("likes")
            .select("discussion_id")
            .eq("user_id", user.id)
            .in("discussion_id", discussions.map((d) => d.id))
        : Promise.resolve({ data: [] as { discussion_id: string }[] }),
    ]);

  const likedResourceIds = new Set(likedResources?.map((l) => l.resource_id));
  const likedArticleIds = new Set(likedArticles?.map((l) => l.article_id));
  const likedDiscussionIds = new Set(likedDiscussions?.map((l) => l.discussion_id));

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
      discussions: discussions.map((d) => ({
        ...normalize(d),
        top_reply: d.top_reply ? (topReplyContent.get(d.top_reply) ?? null) : null,
        isSaved: true,
        isLiked: likedDiscussionIds.has(d.id),
      })),
    },
  };
}
