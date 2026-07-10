"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "../admin";
import type { ActionResult, Discussion } from "../types";

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

export async function getDiscussion(
  discussionId: string,
): Promise<ActionResult<{ discussion: Discussion; replies: any[] }>> {
  const supabase = await createClient();

  const { data: discussion, error: dErr } = await supabase
    .from("discussions")
    .select("*, author:users(display_name, is_pro)")
    .eq("id", discussionId)
    .single();

  if (dErr || !discussion)
    return { success: false, error: "Discussion not found" };

  const { data: replies, error: rErr } = await supabase
    .from("discussion_replies")
    .select("*, author:users(display_name, is_pro)")
    .eq("discussion_id", discussionId)
    .order("like_count", { ascending: false });

  if (rErr) return { success: false, error: rErr.message };

  return {
    success: true,
    data: {
      discussion: {
        ...discussion,
        author: Array.isArray(discussion.author)
          ? discussion.author[0]
          : discussion.author,
      },
      replies: (replies ?? []).map((r) => ({
        ...r,
        author: Array.isArray(r.author) ? r.author[0] : r.author,
      })),
    },
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
    .select("*, author:users(display_name, is_pro)")
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
    .select("*, author:users(display_name, is_pro)")
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
