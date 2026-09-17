"use server";

import { createClient } from "../supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "../admin";
import type { ActionResult } from "../types";

// The /community feature (discussions + replies) was retired in favor of
// the Hub — creating, editing, replying to, and viewing individual
// discussions all went away with it. This is the one piece still actually
// used: admin moderation (components/admin/ContentTable.tsx) can still
// delete a discussion row without resurrecting any of the removed UI. The
// `discussions`/`discussion_replies` tables and their existing data are
// deliberately kept, not dropped.
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

  revalidatePath("/admin/content");
  return { success: true, data: null };
}
