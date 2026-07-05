"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
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

  if (dErr) return { success: false, error: dErr.message };

  const { data: replies, error: rErr } = await supabase
    .from("discussion_replies")
    .select("*, author:users(display_name, is_pro)")
    .eq("discussion_id", discussionId)
    .order("like_count", { ascending: false });

  if (rErr) return { success: false, error: rErr.message };
  return { success: true, data: { discussion, replies: replies ?? [] } };
}
