"use server";

import { createClient } from "../supabase/server";
import type { ActionResult } from "../types";

export async function submitFeedback(
  content: string,
): Promise<ActionResult<null>> {
  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: "Feedback can't be empty" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    content: trimmed,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}
