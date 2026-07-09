// lib/actions/profile.ts
"use server";

import { createClient } from "../supabase/server";
import type {
  ActionResult,
  UserProfile,
  Article,
  Resource,
  Discussion,
} from "@/app/lib/types";

export async function getPublicProfile(userId: string): Promise<
  ActionResult<{
    user: UserProfile;
    articles: Article[];
    resources: Resource[];
    discussions: Discussion[];
    commentsWritten: any[];
    totalLikes: number;
    total_downloads: number;
    drafts: Article[] | null;
  }>
> {
  const supabase = await createClient();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (userError) return { success: false, error: userError.message };

  const [
    { data: articles, error: articlesError },
    { data: resources, error: resourcesError },
    { data: discussions, error: discussionsError },
  ] = await Promise.all([
    supabase
      .from("articles")
      .select("*, author:users(display_name, is_pro)")
      .eq("author_id", userId)
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("resources")
      .select("*, author:users(display_name, is_pro, ib_year)")
      .eq("author_id", userId)
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("discussions")
      .select("*, author:users(display_name, is_pro)")
      .eq("author_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const { data: drafts, error: draftError } = await supabase
    .from("articles")
    .select("*, author:users(display_name, is_pro)")
    .eq("author_id", userId)
    .eq("published", false)
    .order("created_at", { ascending: false });

  if (articlesError) return { success: false, error: articlesError.message };
  if (resourcesError) return { success: false, error: resourcesError.message };
  if (discussionsError)
    return { success: false, error: discussionsError.message };
  if (draftError) return { success: false, error: draftError.message };

  const normalizedResources = resources.map((r) => ({
    ...r,
    author: Array.isArray(r.author) ? r.author[0] : r.author,
  }));
  const normalizedArticles = articles.map((a) => ({
    ...a,
    author: Array.isArray(a.author) ? a.author[0] : a.author,
  }));
  const normalizedDiscussions = discussions.map((d) => ({
    ...d,
    author: Array.isArray(d.author) ? d.author[0] : d.author,
  }));

  const articleIds = articles.map((a) => a.id);
  const resourceIds = resources.map((r) => r.id);
  const discussionIds = discussions.map((d) => d.id);

  const [
    { count: articleComments },
    { count: resourceComments },
    { count: discussionReplies },
    { data: commentsWritten },
  ] = await Promise.all([
    articleIds.length
      ? supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .in("article_id", articleIds)
      : Promise.resolve({ count: 0 }),
    resourceIds.length
      ? supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .in("resource_id", resourceIds)
      : Promise.resolve({ count: 0 }),
    discussionIds.length
      ? supabase
          .from("discussion_replies")
          .select("*", { count: "exact", head: true })
          .in("discussion_id", discussionIds)
      : Promise.resolve({ count: 0 }),
    supabase
      .from("comments")
      .select("*, resource:resources(title), article:articles(title, slug)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);
  const commentsReceived =
    (articleComments ?? 0) + (resourceComments ?? 0) + (discussionReplies ?? 0);

  const totalLikes =
    articles.reduce((sum, a) => sum + a.like_count, 0) +
    resources.reduce((sum, r) => sum + r.like_count, 0) +
    discussions.reduce((sum, d) => sum + d.like_count, 0);

  const total_downloads = resources.reduce(
    (sum, r) => sum + r.download_count,
    0,
  );

  const normalizedDrafts = drafts?.map((a) => ({
    ...a,
    author: Array.isArray(a.author) ? a.author[0] : a.author,
  }));

  return {
    success: true,
    data: {
      user,
      articles: normalizedArticles,
      resources: normalizedResources,
      discussions: normalizedDiscussions,
      totalLikes,
      total_downloads,
      commentsWritten: commentsWritten ?? [],
      drafts: normalizedDrafts ?? null,
    },
  };
}
