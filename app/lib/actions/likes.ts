"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "../types";

type LikeTarget =
  | { resource_id: string }
  | { article_id: string }
  | { discussion_id: string }
  | { discussion_reply_id: string };

export async function toggleLike(
  target: LikeTarget,
  path: string,
): Promise<ActionResult<{ liked: boolean }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .match({ user_id: user.id, ...target })
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    revalidatePath(path);
    return { success: true, data: { liked: false } };
  } else {
    const { error } = await supabase
      .from("likes")
      .insert({ user_id: user.id, ...target });
    if (error) return { success: false, error: error.message };
    revalidatePath(path);
    return { success: true, data: { liked: true } };
  }
}
