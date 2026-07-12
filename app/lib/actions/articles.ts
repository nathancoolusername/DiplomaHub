"use server";

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { revalidatePath } from "next/cache";
import sanitizeHtml from "sanitize-html";
import { isAdmin } from "../admin";
import type { ActionResult, Article } from "../types";

const ARTICLE_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "div",
    "br",
    "b",
    "strong",
    "i",
    "em",
    "ul",
    "ol",
    "li",
    "a",
    "blockquote",
    "h2",
    "h3",
  ],
  allowedAttributes: {
    a: ["href", "rel", "target"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
      target: "_blank",
    }),
  },
};

export async function getArticle(slug: string): Promise<ActionResult<Article>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("articles")
    .select("*, author:users(display_name, is_pro, ib_year, avatar_url)")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error) return { success: false, error: error.message };

  const admin = createAdminClient();
  admin.rpc("increment_view_count", { target_article_id: data.id }).then();

  const article = {
    ...data,
    author: Array.isArray(data.author) ? data.author[0] : data.author,
  };

  if (!user) {
    return { success: true, data: { ...article, isLiked: false, isSaved: false } };
  }

  const [{ data: like }, { data: save }] = await Promise.all([
    supabase
      .from("likes")
      .select("id")
      .match({ user_id: user.id, article_id: data.id })
      .maybeSingle(),
    supabase
      .from("saved_items")
      .select("id")
      .match({ user_id: user.id, article_id: data.id })
      .maybeSingle(),
  ]);

  return {
    success: true,
    data: { ...article, isLiked: !!like, isSaved: !!save },
  };
}

export async function getArticlesWithUserState(): Promise<
  ActionResult<Article[]>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: articles, error } = await supabase
    .from("articles")
    .select("*, author:users(display_name, is_pro, ib_year, avatar_url)")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  const normalized = articles.map((a) => ({
    ...a,
    author: Array.isArray(a.author) ? a.author[0] : a.author,
  }));

  if (!user) {
    return {
      success: true,
      data: normalized.map((a) => ({ ...a, isLiked: false, isSaved: false })),
    };
  }

  const articleIds = normalized.map((a) => a.id);

  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase
      .from("likes")
      .select("article_id")
      .eq("user_id", user.id)
      .in("article_id", articleIds),
    supabase
      .from("saved_items")
      .select("article_id")
      .eq("user_id", user.id)
      .in("article_id", articleIds),
  ]);

  const likedIds = new Set(likes?.map((l) => l.article_id));
  const savedIds = new Set(saves?.map((s) => s.article_id));

  return {
    success: true,
    data: normalized.map((a) => ({
      ...a,
      isLiked: likedIds.has(a.id),
      isSaved: savedIds.has(a.id),
    })),
  };
}

export async function getArticleForEdit(
  slug: string,
): Promise<ActionResult<Article>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { data, error } = await supabase
    .from("articles")
    .select("*, author:users(display_name, is_pro, avatar_url)")
    .eq("slug", slug)
    .single();

  if (error || !data) return { success: false, error: "Article not found" };
  if (data.author_id !== user.id && !isAdmin(user.id)) {
    return { success: false, error: "You can only edit your own articles" };
  }

  return {
    success: true,
    data: {
      ...data,
      author: Array.isArray(data.author) ? data.author[0] : data.author,
    },
  };
}

export async function getArticles(): Promise<ActionResult<Article[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, author:users(display_name, is_pro, avatar_url)")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: data.map((a) => ({
      ...a,
      author: Array.isArray(a.author) ? a.author[0] : a.author,
    })),
  };
}

export async function deleteArticle(
  articleId: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  let query = supabase.from("articles").delete().eq("id", articleId);
  if (!isAdmin(user.id)) {
    query = query.eq("author_id", user.id);
  }
  const { data, error } = await query.select("id");

  if (error) return { success: false, error: error.message };
  if (!data || data.length === 0)
    return { success: false, error: "You can only delete your own articles" };

  revalidatePath("/articles");
  return { success: true, data: null };
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
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  // Two articles with the same (or similarly-normalized) title would
  // otherwise collide on the `slug unique` constraint — append a short
  // random suffix so that can't happen.
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

  const rawContent = formData.get("content") as string;
  const content = sanitizeHtml(rawContent, ARTICLE_HTML_OPTIONS);
  const coverImageUrl = (formData.get("cover_image_url") as string) || null;
  const published = formData.get("published") === "true";

  const { data, error } = await supabase
    .from("articles")
    .insert({
      title,
      slug,
      content,
      cover_image_url: coverImageUrl,
      topic: formData.get("topic") as string,
      author_id: user.id,
      published,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/articles");
  return { success: true, data };
}

export async function updateArticle(
  articleId: string,
  formData: FormData,
): Promise<ActionResult<Article>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const rawContent = formData.get("content") as string;
  const content = sanitizeHtml(rawContent, ARTICLE_HTML_OPTIONS);
  const coverImageUrl = (formData.get("cover_image_url") as string) || null;
  const published = formData.get("published") === "true";

  let query = supabase
    .from("articles")
    .update({
      title: formData.get("title") as string,
      content,
      cover_image_url: coverImageUrl,
      topic: formData.get("topic") as string,
      published,
    })
    .eq("id", articleId);

  if (!isAdmin(user.id)) {
    query = query.eq("author_id", user.id);
  }

  const { data, error } = await query.select().maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!data)
    return { success: false, error: "You can only edit your own articles" };

  revalidatePath("/articles");
  revalidatePath(`/articles/${data.slug}`);
  return { success: true, data };
}
