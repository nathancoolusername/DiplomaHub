"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "../admin";
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

  const { data, error } = await supabase
    .from("comments")
    .insert({ user_id: user.id, content, ...target })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
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
