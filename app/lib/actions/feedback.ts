"use server";

import { createClient } from "../supabase/server";
import { checkRateLimit, getClientIp } from "../ratelimit";
import type { ActionResult } from "../types";

export async function submitFeedback(
  content: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rateLimit = await checkRateLimit(
    "write",
    user?.id ?? (await getClientIp()),
  );
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const trimmed = content.trim();
  if (!trimmed) return { success: false, error: "Feedback can't be empty" };
  if (trimmed.length > 5000) {
    return { success: false, error: "Feedback must be under 5000 characters" };
  }

  const { error } = await supabase.from("feedback").insert({
    user_id: user?.id ?? null,
    content: trimmed,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}
