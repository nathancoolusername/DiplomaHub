"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "../admin";
import { createNotification } from "./notifications";
import { requireField, requireOneOf } from "../validation";
import { checkRateLimit } from "../ratelimit";
import { SubjectTags, YEAR_OPTIONS } from "@/components/pills";
import type { ActionResult, Discussion, DiscussionReply } from "../types";

const SUBJECT_OPTIONS = Object.keys(SubjectTags);
// Must match components/community/discussion-panel.tsx's `typeTags` — kept
// as a separate list there rather than in components/pills.tsx.
const DISCUSSION_TYPE_OPTIONS = ["Discussion", "Resource", "Question"];

function validateDiscussionFields(formData: FormData) {
  const title = requireField(formData.get("title"), "Title", 200);
  if ("error" in title) return title;

  const content = requireField(formData.get("content"), "Content", 5000);
  if ("error" in content) return content;

  const subject_tag = requireOneOf(
    formData.get("subject_tag"),
    "Subject",
    SUBJECT_OPTIONS,
  );
  if ("error" in subject_tag) return subject_tag;

  const type_tag = requireOneOf(
    formData.get("type_tag"),
    "Type",
    DISCUSSION_TYPE_OPTIONS,
  );
  if ("error" in type_tag) return type_tag;

  const year_tag = requireOneOf(formData.get("year_tag"), "Year", YEAR_OPTIONS);
  if ("error" in year_tag) return year_tag;

  return {
    value: {
      title: title.value,
      content: content.value,
      subject_tag: subject_tag.value,
      type_tag: type_tag.value,
      year_tag: year_tag.value,
    },
  };
}

export async function createDiscussion(
  formData: FormData,
): Promise<ActionResult<Discussion>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const rateLimit = await checkRateLimit("write", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const fields = validateDiscussionFields(formData);
  if ("error" in fields) return { success: false, error: fields.error };

  const { data, error } = await supabase
    .from("discussions")
    .insert({ ...fields.value, author_id: user.id })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/community");
  return { success: true, data };
}

export async function updateDiscussion(
  discussionId: string,
  formData: FormData,
): Promise<ActionResult<Discussion>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const fields = validateDiscussionFields(formData);
  if ("error" in fields) return { success: false, error: fields.error };

  let query = supabase
    .from("discussions")
    .update(fields.value)
    .eq("id", discussionId);

  if (!isAdmin(user.id)) {
    query = query.eq("author_id", user.id);
  }

  const { data, error } = await query.select().maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!data)
    return {
      success: false,
      error: "You can only edit your own discussions",
    };

  revalidatePath("/community");
  revalidatePath(`/community/${discussionId}`);
  return { success: true, data };
}

export async function deleteDiscussion(
  discussionId: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  let query = supabase.from("discussions").delete().eq("id", discussionId);
  if (!isAdmin(user.id)) {
    query = query.eq("author_id", user.id);
  }
  const { data, error } = await query.select("id");

  if (error) return { success: false, error: error.message };
  if (!data || data.length === 0)
    return {
      success: false,
      error: "You can only delete your own discussions",
    };

  revalidatePath("/community");
  return { success: true, data: null };
}

export async function replyToDiscussion(
  discussionId: string,
  content: string,
  parentReplyId?: string,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const rateLimit = await checkRateLimit("write", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const trimmedContent = content.trim();
  if (!trimmedContent) return { success: false, error: "Reply cannot be empty" };
  if (trimmedContent.length > 2000) {
    return { success: false, error: "Reply must be under 2000 characters" };
  }

  const { data, error } = await supabase
    .from("discussion_replies")
    .insert({
      discussion_id: discussionId,
      author_id: user.id,
      content: trimmedContent,
      parent_reply_id: parentReplyId ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  const [{ data: actor }, { data: discussion }] = await Promise.all([
    supabase.from("users").select("display_name").eq("id", user.id).single(),
    supabase
      .from("discussions")
      .select("title, author_id")
      .eq("id", discussionId)
      .single(),
  ]);
  if (actor && discussion) {
    await createNotification({
      userId: discussion.author_id,
      actorId: user.id,
      type: "reply_discussion",
      message: `${actor.display_name} replied to your discussion "${discussion.title}"`,
      link: `/community/${discussionId}`,
    });
  }

  revalidatePath(`/community/${discussionId}`);
  return { success: true, data };
}

export async function deleteReply(
  replyId: string,
  discussionId: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  let query = supabase.from("discussion_replies").delete().eq("id", replyId);
  if (!isAdmin(user.id)) {
    query = query.eq("author_id", user.id);
  }
  const { data, error } = await query.select("id");

  if (error) return { success: false, error: error.message };
  if (!data || data.length === 0)
    return { success: false, error: "You can only delete your own replies" };

  revalidatePath(`/community/${discussionId}`);
  return { success: true, data: null };
}

export async function getDiscussion(
  discussionId: string,
): Promise<
  ActionResult<{ discussion: Discussion; replies: DiscussionReply[] }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: discussion, error: dErr } = await supabase
    .from("discussions")
    .select("*, author:users(display_name, is_pro, ib_year, avatar_url)")
    .eq("id", discussionId)
    .single();

  if (dErr || !discussion)
    return { success: false, error: "Discussion not found" };

  const { data: replies, error: rErr } = await supabase
    .from("discussion_replies")
    .select("*, author:users(display_name, is_pro, ib_year, avatar_url)")
    .eq("discussion_id", discussionId)
    .order("created_at", { ascending: true });

  if (rErr) return { success: false, error: rErr.message };

  const normalizedDiscussion = {
    ...discussion,
    author: Array.isArray(discussion.author)
      ? discussion.author[0]
      : discussion.author,
  };
  const normalizedReplies = (replies ?? []).map((r) => ({
    ...r,
    author: Array.isArray(r.author) ? r.author[0] : r.author,
  }));

  if (!user) {
    return {
      success: true,
      data: {
        discussion: { ...normalizedDiscussion, isLiked: false, isSaved: false },
        replies: normalizedReplies.map((r) => ({ ...r, isLiked: false })),
      },
    };
  }

  const replyIds = normalizedReplies.map((r) => r.id);

  const [{ data: discussionLike }, { data: discussionSave }, { data: replyLikes }] =
    await Promise.all([
      supabase
        .from("likes")
        .select("id")
        .match({ user_id: user.id, discussion_id: discussionId })
        .maybeSingle(),
      supabase
        .from("saved_items")
        .select("id")
        .match({ user_id: user.id, discussion_id: discussionId })
        .maybeSingle(),
      supabase
        .from("likes")
        .select("discussion_reply_id")
        .eq("user_id", user.id)
        .in("discussion_reply_id", replyIds),
    ]);

  const likedReplyIds = new Set(replyLikes?.map((l) => l.discussion_reply_id));

  return {
    success: true,
    data: {
      discussion: {
        ...normalizedDiscussion,
        isLiked: !!discussionLike,
        isSaved: !!discussionSave,
      },
      replies: normalizedReplies.map((r) => ({
        ...r,
        isLiked: likedReplyIds.has(r.id),
      })),
    },
  };
}

export type DiscussionSort = "newest" | "hot";

// Shared by getDiscussionsPage/getTrendingDiscussions: takes raw discussion
// rows (as returned by the get_discussions_page RPC — no author join, no
// top_reply resolution) and attaches author info, resolves top_reply from a
// FK to actual text, and attaches the current viewer's isLiked/isSaved.
async function enrichDiscussions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  // Raw RPC rows aren't typed (this project has no generated Supabase types).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  discussions: any[],
  userId: string | null,
): Promise<Discussion[]> {
  if (discussions.length === 0) return [];

  const authorIds = [...new Set(discussions.map((d) => d.author_id))];
  const topReplyIds = discussions
    .map((d) => d.top_reply)
    .filter((id): id is string => !!id);

  const [{ data: authors }, { data: topReplies }] = await Promise.all([
    supabase
      .from("users")
      .select("id, display_name, is_pro, ib_year, avatar_url")
      .in("id", authorIds),
    topReplyIds.length
      ? supabase.from("discussion_replies").select("id, content").in("id", topReplyIds)
      : Promise.resolve({ data: [] as { id: string; content: string }[] }),
  ]);

  const authorById = new Map(authors?.map((a) => [a.id, a]));
  const topReplyContent = new Map(topReplies?.map((r) => [r.id, r.content]));

  const normalized = discussions.map((d) => ({
    ...d,
    author: authorById.get(d.author_id),
    top_reply: d.top_reply ? (topReplyContent.get(d.top_reply) ?? null) : null,
  }));

  if (!userId) {
    return normalized.map((d) => ({ ...d, isLiked: false, isSaved: false }));
  }

  const discussionIds = normalized.map((d) => d.id);
  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase
      .from("likes")
      .select("discussion_id")
      .eq("user_id", userId)
      .in("discussion_id", discussionIds),
    supabase
      .from("saved_items")
      .select("discussion_id")
      .eq("user_id", userId)
      .in("discussion_id", discussionIds),
  ]);
  const likedIds = new Set(likes?.map((l) => l.discussion_id));
  const savedIds = new Set(saves?.map((s) => s.discussion_id));

  return normalized.map((d) => ({
    ...d,
    isLiked: likedIds.has(d.id),
    isSaved: savedIds.has(d.id),
  }));
}

// Filters/sorts/paginates via the get_discussions_page Postgres function
// instead of fetching every discussion and sorting in JS — "Hot" sort is a
// computed formula (likes + replies / (daysOld+2)^1.5), not a plain column,
// so it can't be expressed as a normal .order() call and needs the DB-side
// function to paginate correctly.
export async function getDiscussionsPage(filters: {
  subject?: string;
  type?: string;
  year?: string;
  sort?: DiscussionSort;
  page?: number;
  pageSize?: number;
}): Promise<ActionResult<{ items: Discussion[]; totalCount: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize =
    filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 6;
  const offset = (page - 1) * pageSize;

  const [{ data: rows, error }, { data: totalCount, error: countError }] =
    await Promise.all([
      supabase.rpc("get_discussions_page", {
        p_subject: filters.subject ?? null,
        p_type: filters.type ?? null,
        p_year: filters.year ?? null,
        p_sort: filters.sort ?? "newest",
        p_limit: pageSize,
        p_offset: offset,
      }),
      supabase.rpc("count_discussions", {
        p_subject: filters.subject ?? null,
        p_type: filters.type ?? null,
        p_year: filters.year ?? null,
      }),
    ]);

  if (error) return { success: false, error: error.message };
  if (countError) return { success: false, error: countError.message };

  const items = await enrichDiscussions(supabase, rows ?? [], user?.id ?? null);
  return { success: true, data: { items, totalCount: totalCount ?? 0 } };
}

// Top N discussions by hot score across the whole board, unfiltered — used
// for the "Trending This Week" cards, which need to look beyond whatever
// page/filters the main list is currently showing.
export async function getTrendingDiscussions(
  limit = 10,
): Promise<ActionResult<Discussion[]>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows, error } = await supabase.rpc("get_discussions_page", {
    p_subject: null,
    p_type: null,
    p_year: null,
    p_sort: "hot",
    p_limit: limit,
    p_offset: 0,
  });
  if (error) return { success: false, error: error.message };

  const items = await enrichDiscussions(supabase, rows ?? [], user?.id ?? null);
  return { success: true, data: items };
}

export async function getDiscussionForEdit(
  discussionId: string,
): Promise<ActionResult<Discussion>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { data, error } = await supabase
    .from("discussions")
    .select("*, author:users(display_name, is_pro, avatar_url)")
    .eq("id", discussionId)
    .single();

  if (error || !data)
    return { success: false, error: "Discussion not found" };
  if (data.author_id !== user.id && !isAdmin(user.id)) {
    return {
      success: false,
      error: "You can only edit your own discussions",
    };
  }

  return {
    success: true,
    data: {
      ...data,
      author: Array.isArray(data.author) ? data.author[0] : data.author,
    },
  };
}

export async function getDiscussions(): Promise<ActionResult<Discussion[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discussions")
    .select("*, author:users(display_name, is_pro, avatar_url)")
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: data.map((d) => ({
      ...d,
      author: Array.isArray(d.author) ? d.author[0] : d.author,
    })),
  };
}
