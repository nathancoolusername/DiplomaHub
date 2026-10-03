"use server";

import { unstable_cache } from "next/cache";
import { createPublicClient } from "../supabase/public";
import { getResourceCountsBySubject } from "./resources";
import type { ActionResult } from "../types";

export type HomepageStats = {
  resourceCount: number;
  subjectCount: number;
  userCount: number;
};

// Cached for an hour across all visitors — a stat line on a public page
// doesn't need to be live. Cookie-less client because unstable_cache
// scopes can't read cookies. Throws on error so a failure is never cached.
const getCachedUserCount = unstable_cache(
  async (): Promise<number> => {
    const { count, error } = await createPublicClient()
      .from("users")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
  ["homepage-user-count"],
  { revalidate: 3600 },
);

// Public, real counts for the homepage hero stat line. Resource and subject
// totals are derived from the same cached per-subject counts the "Resources
// by subject" grid uses, rather than scanning the resources table again.
export async function getHomepageStats(): Promise<ActionResult<HomepageStats>> {
  try {
    const [countsResult, userCount] = await Promise.all([
      getResourceCountsBySubject(),
      getCachedUserCount(),
    ]);
    if (!countsResult.success) return { success: false, error: countsResult.error };

    const counts = Object.values(countsResult.data);
    return {
      success: true,
      data: {
        resourceCount: counts.reduce((sum, n) => sum + n, 0),
        subjectCount: counts.length,
        userCount,
      },
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Couldn't load homepage stats",
    };
  }
}
