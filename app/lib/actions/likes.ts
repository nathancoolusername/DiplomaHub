"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";
import type { ActionResult } from "../types";

type LikeTarget =
  | { resource_id: string }
  | { article_id: string }
  | { discussion_id: string }
  | { discussion_reply_id: string };

async function notifyForLike(
  supabase: Awaited<ReturnType<typeof createClient>>,
  target: LikeTarget,
  actorId: string,
  actorName: string,
) {
  if ("resource_id" in target) {
    const { data } = await supabase
      .from("resources")
      .select("title, author_id")
      .eq("id", target.resource_id)
      .single();
    if (!data) return;
    await createNotification({
      userId: data.author_id,
      actorId,
      type: "like_resource",
      message: `${actorName} liked your resource "${data.title}"`,
      link: `/resources/${target.resource_id}`,
    });
  } else if ("article_id" in target) {
    const { data } = await supabase
      .from("articles")
      .select("title, slug, author_id")
      .eq("id", target.article_id)
      .single();
    if (!data) return;
    await createNotification({
      userId: data.author_id,
      actorId,
      type: "like_article",
      message: `${actorName} liked your article "${data.title}"`,
      link: `/articles/${data.slug}`,
    });
  } else if ("discussion_id" in target) {
    const { data } = await supabase
      .from("discussions")
      .select("title, author_id")
      .eq("id", target.discussion_id)
      .single();
    if (!data) return;
    await createNotification({
      userId: data.author_id,
      actorId,
      type: "like_discussion",
      message: `${actorName} liked your discussion "${data.title}"`,
      link: `/community/${target.discussion_id}`,
    });
  } else if ("discussion_reply_id" in target) {
    const { data } = await supabase
      .from("discussion_replies")
      .select("author_id, discussion_id")
      .eq("id", target.discussion_reply_id)
      .single();
    if (!data) return;
    await createNotification({
      userId: data.author_id,
      actorId,
      type: "like_reply",
      message: `${actorName} liked your reply`,
      link: `/community/${data.discussion_id}`,
    });
  }
}

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

    const { data: actor } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single();
    if (actor) {
      await notifyForLike(supabase, target, user.id, actor.display_name);
    }

    revalidatePath(path);
    return { success: true, data: { liked: true } };
  }
}
