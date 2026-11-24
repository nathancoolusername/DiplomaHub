import "server-only";

import { createAdminClient } from "@/app/lib/supabase/admin";

/**
 * How many students have joined the launch campaign.
 *
 * Decided 2026-11-24: only PAID sign-ups (card saved at checkout) count
 * towards the launch price. Until the campaign opens (and checkout exists),
 * this shows the DiplomaPro list (pro_waitlist) as a pre-launch number. At the
 * campaign's launch, switch this to count campaign sign-ups; the counter and
 * the API route don't need to change.
 */
export async function getCampaignJoined(): Promise<number> {
  const { count, error } = await createAdminClient().from("pro_waitlist").select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}
