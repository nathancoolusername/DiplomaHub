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
      .select("*, author:users(display_name, is_pro, avatar_url)")
      .eq("author_id", userId)
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("resources")
      .select("*, author:users(display_name, is_pro, ib_year, avatar_url)")
      .eq("author_id", userId)
      .eq("published", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("discussions")
      .select("*, author:users(display_name, is_pro, avatar_url)")
      .eq("author_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const { data: drafts, error: draftError } = await supabase
    .from("articles")
    .select("*, author:users(display_name, is_pro, avatar_url)")
    .eq("author_id", userId)
    .eq("published", false)
    .order("created_at", { ascending: false });

  if (articlesError) return { success: false, error: articlesError.message };
  if (resourcesError) return { success: false, error: resourcesError.message };
  if (discussionsError)
    return { success: false, error: discussionsError.message };
  if (draftError) return { success: false, error: draftError.message };

  const articleIds = articles.map((a) => a.id);
  const resourceIds = resources.map((r) => r.id);
  const discussionIds = discussions.map((d) => d.id);

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

  // isLiked/isSaved reflect the CURRENT VIEWER, not the profile owner —
  // someone else's profile still needs to show whether *I* liked/saved
  // their content.
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();

  const likedArticleIds = new Set<string>();
  const likedResourceIds = new Set<string>();
  const likedDiscussionIds = new Set<string>();
  const savedArticleIds = new Set<string>();
  const savedResourceIds = new Set<string>();
  const savedDiscussionIds = new Set<string>();

  if (viewer) {
    const orParts: string[] = [];
    if (articleIds.length) orParts.push(`article_id.in.(${articleIds.join(",")})`);
    if (resourceIds.length) orParts.push(`resource_id.in.(${resourceIds.join(",")})`);
    if (discussionIds.length)
      orParts.push(`discussion_id.in.(${discussionIds.join(",")})`);

    if (orParts.length) {
      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase
          .from("likes")
          .select("article_id, resource_id, discussion_id")
          .eq("user_id", viewer.id)
          .or(orParts.join(",")),
        supabase
          .from("saved_items")
          .select("article_id, resource_id, discussion_id")
          .eq("user_id", viewer.id)
          .or(orParts.join(",")),
      ]);

      likes?.forEach((l) => {
        if (l.article_id) likedArticleIds.add(l.article_id);
        if (l.resource_id) likedResourceIds.add(l.resource_id);
        if (l.discussion_id) likedDiscussionIds.add(l.discussion_id);
      });
      saves?.forEach((s) => {
        if (s.article_id) savedArticleIds.add(s.article_id);
        if (s.resource_id) savedResourceIds.add(s.resource_id);
        if (s.discussion_id) savedDiscussionIds.add(s.discussion_id);
      });
    }
  }

  const normalizedResources = resources.map((r) => ({
    ...r,
    author: Array.isArray(r.author) ? r.author[0] : r.author,
    isLiked: likedResourceIds.has(r.id),
    isSaved: savedResourceIds.has(r.id),
  }));
  const normalizedArticles = articles.map((a) => ({
    ...a,
    author: Array.isArray(a.author) ? a.author[0] : a.author,
    isLiked: likedArticleIds.has(a.id),
    isSaved: savedArticleIds.has(a.id),
  }));
  const normalizedDiscussions = discussions.map((d) => ({
    ...d,
    author: Array.isArray(d.author) ? d.author[0] : d.author,
    top_reply: d.top_reply ? (topReplyContent.get(d.top_reply) ?? null) : null,
    isLiked: likedDiscussionIds.has(d.id),
    isSaved: savedDiscussionIds.has(d.id),
  }));

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

export type TopContributor = {
  id: string;
  display_name: string;
  points: number;
  is_pro: boolean;
  avatar_url: string | null;
};

export async function getTopContributors(
  limit = 5,
): Promise<ActionResult<TopContributor[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, points, is_pro, avatar_url")
    .order("points", { ascending: false })
    .limit(limit);

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
