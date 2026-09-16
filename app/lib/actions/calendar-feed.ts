"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { createClient } from "../supabase/server";
import { checkRateLimit } from "../ratelimit";
import { resolveOrigin } from "../resolveOrigin";
import type { ActionResult } from "../types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type CalendarFeedStatus = {
  exists: boolean;
  includeTasks: boolean;
  includeStudyBlocks: boolean;
  createdAt: string | null;
};

export async function getCalendarFeedStatus(): Promise<ActionResult<CalendarFeedStatus>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to sync your Hub to a calendar" };

  const { data, error } = await supabase
    .from("calendar_feeds")
    .select("include_tasks, include_study_blocks, created_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { success: false, error: error.message };
  if (!data) {
    return { success: true, data: { exists: false, includeTasks: true, includeStudyBlocks: false, createdAt: null } };
  }
  return {
    success: true,
    data: {
      exists: true,
      includeTasks: data.include_tasks,
      includeStudyBlocks: data.include_study_blocks,
      createdAt: data.created_at,
    },
  };
}

// Creates the feed if none exists yet, or replaces the token (and thus
// invalidates any previously-issued URL) if one already does — same action
// either way, matching the UI's single "Generate link" / "Generate new
// link" button. The raw token is returned to the caller exactly once and
// never persisted anywhere; only its SHA-256 hash is stored, so this is the
// only moment the full subscribe URL can ever be shown.
export async function generateCalendarFeed(
  includeTasks: boolean,
  includeStudyBlocks: boolean,
): Promise<ActionResult<{ url: string }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to sync your Hub to a calendar" };
  if (typeof includeTasks !== "boolean" || typeof includeStudyBlocks !== "boolean") {
    return { success: false, error: "Invalid settings" };
  }

  const rateLimit = await checkRateLimit("write", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);

  const { error } = await supabase.from("calendar_feeds").upsert(
    {
      user_id: user.id,
      token_hash: tokenHash,
      include_tasks: includeTasks,
      include_study_blocks: includeStudyBlocks,
      created_at: new Date().toISOString(),
      last_accessed_at: null,
    },
    { onConflict: "user_id" },
  );
  if (error) return { success: false, error: error.message };

  const origin = resolveOrigin(await headers());
  return { success: true, data: { url: `${origin}/api/calendar/${token}.ics` } };
}

export async function updateCalendarFeedSettings(
  includeTasks: boolean,
  includeStudyBlocks: boolean,
): Promise<ActionResult<null>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to change these settings" };
  if (typeof includeTasks !== "boolean" || typeof includeStudyBlocks !== "boolean") {
    return { success: false, error: "Invalid settings" };
  }

  const rateLimit = await checkRateLimit("toggle", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const { error } = await supabase
    .from("calendar_feeds")
    .update({ include_tasks: includeTasks, include_study_blocks: includeStudyBlocks })
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}
