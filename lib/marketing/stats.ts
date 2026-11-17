import "server-only";

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/app/lib/supabase/admin";

/**
 * How many verified practice questions are in the bank, for the homepage
 * stats. The bank isn't readable by visitors, so this counts with the
 * server client (a count only, no rows). Cached for a day; throws on error
 * so a failure is never cached.
 */
export const getPracticeQuestionCount = unstable_cache(
  async (): Promise<number> => {
    const { count, error } = await createAdminClient().from("questions").select("id", { count: "exact", head: true }).eq("status", "verified");
    if (error) throw new Error(error.message);
    return count ?? 0;
  },
  ["homepage-question-count"],
  { revalidate: 86_400 },
);
