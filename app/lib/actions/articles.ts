"use server";

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { revalidatePath } from "next/cache";
import sanitizeHtml from "sanitize-html";
import { isAdmin } from "../admin";
import { requireField, optionalField } from "../validation";
import type { ActionResult, Article } from "../types";

const ARTICLE_CONTENT_MAX_LENGTH = 100_000;

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

function validateArticleContent(formData: FormData) {
  const title = requireField(formData.get("title"), "Title", 200);
  if ("error" in title) return title;

  const topic = requireField(formData.get("topic"), "Topic", 100);
  if ("error" in topic) return topic;

  const rawContent = formData.get("content");
  const rawContentStr = typeof rawContent === "string" ? rawContent : "";
  if (!rawContentStr.trim()) return { error: "Content is required" };
  if (rawContentStr.length > ARTICLE_CONTENT_MAX_LENGTH) {
    return { error: "Content is too long" };
  }
  const content = sanitizeHtml(rawContentStr, ARTICLE_HTML_OPTIONS);
  if (!content.trim()) return { error: "Content is required" };

  const coverImageUrl = optionalField(
    formData.get("cover_image_url"),
    "Cover image",
    2000,
  );
  if ("error" in coverImageUrl) return coverImageUrl;

  return {
    value: {
      title: title.value,
      topic: topic.value,
      content,
      cover_image_url: coverImageUrl.value,
    },
  };
}

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

export type ArticleSort = "newest" | "oldest" | "most_liked" | "most_viewed";

// Filters/sorts/paginates in the query itself instead of fetching every
// published article and slicing client-side — used by the /articles grid.
// The UI's "subject" filter actually maps to the `topic` column (topic is
// itself constrained to the same SubjectTags option set in the write form).
export async function getArticlesPage(filters: {
  topic?: string;
  sort?: ArticleSort;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<{ items: Article[]; totalCount: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize =
    filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 6;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("articles")
    .select("*, author:users(display_name, is_pro, ib_year, avatar_url)", {
      count: "exact",
    })
    .eq("published", true);

  if (filters.topic) query = query.eq("topic", filters.topic);

  switch (filters.sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "most_liked":
      query = query.order("like_count", { ascending: false });
      break;
    case "most_viewed":
      query = query.order("view_count", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data: articles, error, count } = await query.range(from, to);
  if (error) return { success: false, error: error.message };

  const normalized = articles.map((a) => ({
    ...a,
    author: Array.isArray(a.author) ? a.author[0] : a.author,
  }));

  if (!user) {
    return {
      success: true,
      data: {
        items: normalized.map((a) => ({ ...a, isLiked: false, isSaved: false })),
        totalCount: count ?? 0,
      },
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
    data: {
      items: normalized.map((a) => ({
        ...a,
        isLiked: likedIds.has(a.id),
        isSaved: savedIds.has(a.id),
      })),
      totalCount: count ?? 0,
    },
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

  const fields = validateArticleContent(formData);
  if ("error" in fields) return { success: false, error: fields.error };

  const baseSlug = fields.value.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  // Two articles with the same (or similarly-normalized) title would
  // otherwise collide on the `slug unique` constraint — append a short
  // random suffix so that can't happen.
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

  const published = formData.get("published") === "true";

  const { data, error } = await supabase
    .from("articles")
    .insert({
      ...fields.value,
      slug,
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

  const fields = validateArticleContent(formData);
  if ("error" in fields) return { success: false, error: fields.error };

  const published = formData.get("published") === "true";

  let query = supabase
    .from("articles")
    .update({ ...fields.value, published })
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
