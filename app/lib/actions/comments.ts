"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "../admin";
import { createNotification } from "./notifications";
import { checkRateLimit } from "../ratelimit";
import type { ActionResult, Comment } from "../types";

export async function getComments(
  target: { resource_id: string } | { article_id: string },
): Promise<ActionResult<Comment[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("*, author:users(display_name, is_pro, ib_year, avatar_url)")
    .match(target)
    .order("created_at", { ascending: true });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: data.map((c) => ({
      ...c,
      author: Array.isArray(c.author) ? c.author[0] : c.author,
    })),
  };
}

export async function addComment(
  target: { resource_id: string } | { article_id: string },
  content: string,
  path: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const rateLimit = await checkRateLimit("write", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const trimmedContent = content.trim();
  if (!trimmedContent) return { success: false, error: "Comment cannot be empty" };
  if (trimmedContent.length > 2000) {
    return { success: false, error: "Comment must be under 2000 characters" };
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({ user_id: user.id, content: trimmedContent, ...target })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const { data: actor } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .single();
  if (actor) {
    if ("resource_id" in target) {
      const { data: resource } = await supabase
        .from("resources")
        .select("title, author_id")
        .eq("id", target.resource_id)
        .single();
      if (resource) {
        await createNotification({
          userId: resource.author_id,
          actorId: user.id,
          type: "comment_resource",
          message: `${actor.display_name} commented on your resource "${resource.title}"`,
          link: `/resources/${target.resource_id}`,
        });
      }
    } else {
      const { data: article } = await supabase
        .from("articles")
        .select("title, slug, author_id")
        .eq("id", target.article_id)
        .single();
      if (article) {
        await createNotification({
          userId: article.author_id,
          actorId: user.id,
          type: "comment_article",
          message: `${actor.display_name} commented on your article "${article.title}"`,
          link: `/articles/${article.slug}`,
        });
      }
    }
  }

  revalidatePath(path);
  return { success: true, data };
}

export async function deleteComment(
  commentId: string,
  path: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  let query = supabase.from("comments").delete().eq("id", commentId);
  if (!isAdmin(user.id)) {
    query = query.eq("user_id", user.id);
  }
  const { data, error } = await query.select("id");

  if (error) return { success: false, error: error.message };
  if (!data || data.length === 0)
    return { success: false, error: "You can only delete your own comments" };

  revalidatePath(path);
  return { success: true, data: null };
}
