"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "../types";

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
