import "server-only";
import { createPublicClient } from "@/app/lib/supabase/public";
import type { Article, Comment, Resource } from "@/app/lib/types";

// Reads for the article and resource detail pages, which are served from the
// ISR cache (rendered once, then reused for every visitor until revalidated).
// Cookie-less on purpose: anything that depends on who's looking (liked,
// saved, owner controls, the comment box) is filled in by the browser — see
// components/detail/ViewerActions.tsx. Not a "use server" file, so none of
// these become callable endpoints.

function firstAuthor<T extends { author: unknown }>(row: T) {
  return {
    ...row,
    author: Array.isArray(row.author) ? row.author[0] : row.author,
  };
}

export async function getPublishedArticle(slug: string): Promise<Article | null> {
  const { data } = await createPublicClient()
    .from("articles")
    .select("*, author:public_profiles(display_name, is_pro, ib_year, avatar_url)")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data ? firstAuthor(data) : null;
}

export async function getPublishedResource(id: string): Promise<Resource | null> {
  const { data } = await createPublicClient()
    .from("resources")
    .select("*, author:public_profiles(display_name, is_pro, ib_year, avatar_url)")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();
  return data ? firstAuthor(data) : null;
}

export async function getPublicComments(
  target: { resource_id: string } | { article_id: string },
): Promise<Comment[]> {
  const { data } = await createPublicClient()
    .from("comments")
    .select("*, author:public_profiles(display_name, is_pro, ib_year, avatar_url)")
    .match(target)
    .order("created_at", { ascending: true });
  return (data ?? []).map(firstAuthor);
}
