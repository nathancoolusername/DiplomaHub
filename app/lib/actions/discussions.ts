"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "../admin";
import type { ActionResult, Discussion, DiscussionReply } from "../types";

export async function createDiscussion(
  formData: FormData,
): Promise<ActionResult<Discussion>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { data, error } = await supabase
    .from("discussions")
    .insert({
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      subject_tag: formData.get("subject_tag") as string,
      type_tag: formData.get("type_tag") as string,
      year_tag: formData.get("year_tag") as string,
      author_id: user.id,
    })
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

  let query = supabase
    .from("discussions")
    .update({
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      subject_tag: formData.get("subject_tag") as string,
      type_tag: formData.get("type_tag") as string,
      year_tag: formData.get("year_tag") as string,
    })
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

  const { data, error } = await supabase
    .from("discussion_replies")
    .insert({
      discussion_id: discussionId,
      author_id: user.id,
      content,
      parent_reply_id: parentReplyId ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
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

export async function getDiscussionsWithUserState(): Promise<
  ActionResult<Discussion[]>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: discussions, error } = await supabase
    .from("discussions")
    .select("*, author:users(display_name, is_pro, ib_year, avatar_url)")
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  // `top_reply` is a FK (uuid) pointing at discussion_replies.id, not the
  // reply text itself — resolve it to actual content for display.
  const topReplyIds = discussions
    .map((d) => d.top_reply)
    .filter((id): id is string => !!id);

  const { data: topReplies } = topReplyIds.length
    ? await supabase
        .from("discussion_replies")
        .select("id, content")
        .in("id", topReplyIds)
    : { data: [] as { id: string; content: string }[] };

  const topReplyContent = new Map(topReplies?.map((r) => [r.id, r.content]));

  const normalized = discussions.map((d) => ({
    ...d,
    author: Array.isArray(d.author) ? d.author[0] : d.author,
    top_reply: d.top_reply ? (topReplyContent.get(d.top_reply) ?? null) : null,
  }));

  if (!user) {
    return {
      success: true,
      data: normalized.map((d) => ({ ...d, isLiked: false, isSaved: false })),
    };
  }

  const discussionIds = normalized.map((d) => d.id);

  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase
      .from("likes")
      .select("discussion_id")
      .eq("user_id", user.id)
      .in("discussion_id", discussionIds),
    supabase
      .from("saved_items")
      .select("discussion_id")
      .eq("user_id", user.id)
      .in("discussion_id", discussionIds),
  ]);

  const likedIds = new Set(likes?.map((l) => l.discussion_id));
  const savedIds = new Set(saves?.map((s) => s.discussion_id));

  return {
    success: true,
    data: normalized.map((d) => ({
      ...d,
      isLiked: likedIds.has(d.id),
      isSaved: savedIds.has(d.id),
    })),
  };
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
