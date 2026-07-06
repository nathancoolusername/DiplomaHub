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
      resource:resources(*, author:users(display_name)),
      article:articles(*, author:users(display_name)),
      discussion:discussions(*, author:users(display_name))
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: {
      resources: data.filter((d) => d.resource).map((d) => d.resource),
      articles: data.filter((d) => d.article).map((d) => d.article),
      discussions: data.filter((d) => d.discussion).map((d) => d.discussion),
    },
  };
}
