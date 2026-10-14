import "server-only";

import type { Level, SubjectId } from "@/lib/data/types";
import { rpc } from "./client";

export { subjectRequestKey } from "../request-key";

// Subject requests (migration 18): a student asks for practice in a subject
// that has no questions yet. `name` is only for their own ("custom:") subjects.

export async function requestSubject(subjectId: SubjectId, name: string | null, level: Level | null): Promise<void> {
  await rpc("request_subject", { p_subject_id: subjectId, p_name: name, p_level: level });
}

/** Keys of the subjects this student has asked for: catalog ids, or "custom:<lower-cased name>". */
export async function getMySubjectRequests(): Promise<string[]> {
  return (await rpc<string[]>("my_subject_requests")) ?? [];
}
