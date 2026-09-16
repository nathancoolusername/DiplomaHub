"use server";

import { createClient } from "../supabase/server";
import type { ActionResult } from "../types";

export type HomepageStats = {
  resourceCount: number;
  subjectCount: number;
  userCount: number;
};

// Public, real counts for the homepage hero stat line — no auth required,
// same anon-readable tables the resources/community pages already query.
// Round down at render time; never inflate these numbers.
export async function getHomepageStats(): Promise<ActionResult<HomepageStats>> {
  const supabase = await createClient();

  const [resourceCountRes, subjectRowsRes, userCountRes] = await Promise.all([
    supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("published", true),
    supabase.from("resources").select("subject_tag").eq("published", true),
    supabase.from("users").select("id", { count: "exact", head: true }),
  ]);

  if (resourceCountRes.error) {
    return { success: false, error: resourceCountRes.error.message };
  }
  if (subjectRowsRes.error) {
    return { success: false, error: subjectRowsRes.error.message };
  }
  if (userCountRes.error) {
    return { success: false, error: userCountRes.error.message };
  }

  const subjectCount = new Set(
    subjectRowsRes.data.map((r) => r.subject_tag),
  ).size;

  return {
    success: true,
    data: {
      resourceCount: resourceCountRes.count ?? 0,
      subjectCount,
      userCount: userCountRes.count ?? 0,
    },
  };
}
