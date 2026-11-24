import "server-only";

import { createAdminClient } from "@/app/lib/supabase/admin";
import type { ReviewContext } from "./criteria";
import type { ReviewLevel } from "./labels";

/**
 * The student's level in this subject (from their own subjects; null when not
 * set) and their exam year (from their exam session, e.g. "may-2027"). Read
 * with the service-role client, so it works for the server-side marking too.
 */
export async function reviewContext(userId: string, subjectId: string | null, projectLevel: ReviewLevel | null = null): Promise<ReviewContext> {
  const admin = createAdminClient();
  const [{ data: user }, { data: subj }] = await Promise.all([
    admin.from("users").select("exam_session_id").eq("id", userId).maybeSingle(),
    subjectId
      ? admin.from("user_subjects").select("level").eq("user_id", userId).eq("subject_id", subjectId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const year = Number(/(\d{4})$/.exec((user?.exam_session_id as string | null) ?? "")?.[1]) || null;
  const level = (subj as { level: string | null } | null)?.level;
  // The level chosen on the project wins; otherwise the one in their subjects.
  return { level: projectLevel ?? (level === "SL" || level === "HL" ? level : null), examYear: year };
}
