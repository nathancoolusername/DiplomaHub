import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/app/lib/supabase/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { toHubSubjectId } from "@/lib/hub-subjects";
import type { CustomSubject, SubjectId } from "@/components/hub/mock-data";

// The Hub's subjects, read from user_subjects (the one list both Practice
// and the Hub use) instead of users.hub_subjects, which goes in Stage 2.
// The student's six (is_core) in the Hub's ids: language courses become the
// Hub's one language ("english_b" → "english"), and custom subjects come with
// their names. TOK/EE/CAS/General aren't stored: the Hub always adds them.

export type HubSubjects = {
  /** null when the student has no subjects yet (the Hub then shows just the core). */
  subjectIds: SubjectId[] | null;
  customSubjects: CustomSubject[];
};

type Row = { subject_id: string; custom_name: string | null };

/** For any client: the student's own (RLS) or the service role (calendar feed). */
export async function readHubSubjects(supabase: SupabaseClient, userId: string): Promise<HubSubjects> {
  const { data, error } = await supabase
    .from("user_subjects")
    .select("subject_id, custom_name")
    .eq("user_id", userId)
    .eq("is_core", true)
    .order("created_at")
    .order("subject_id");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Row[];
  const subjectIds = [...new Set(rows.map((r) => toHubSubjectId(r.subject_id)))];
  const customSubjects = rows.flatMap((r) => (r.custom_name ? [{ id: r.subject_id, name: r.custom_name }] : []));
  return { subjectIds: subjectIds.length > 0 ? subjectIds : null, customSubjects };
}

/** The signed-in student's Hub subjects (nothing when signed out or unreadable). */
export const getMyHubSubjects = cache(async (): Promise<HubSubjects> => {
  const userId = await getCurrentUserId();
  if (!userId) return { subjectIds: null, customSubjects: [] };
  return readHubSubjects(await createClient(), userId).catch(() => ({ subjectIds: null, customSubjects: [] }));
});
