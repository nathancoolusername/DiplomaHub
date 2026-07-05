"use server";

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { revalidatePath } from "next/cache";
import type { ActionResult, Article } from "../types";

export async function getArticle(slug: string): Promise<ActionResult<Article>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, author:users(display_name, is_pro)")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error) return { success: false, error: error.message };

  const admin = createAdminClient();
  admin.rpc("increment_view_count", { target_article_id: data.id }).then();

  return { success: true, data };
}

export async function createArticle(
  formData: FormData,
): Promise<ActionResult<Article>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const title = formData.get("title") as string;
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data, error } = await supabase
    .from("articles")
    .insert({
      title,
      slug,
      content: formData.get("content") as string,
      topic: formData.get("topic") as string,
      author_id: user.id,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/articles");
  return { success: true, data };
}
