import type { SubjectId } from "@/lib/data/types";

/** The key request_subject() stores for a subject: the catalog id, or "custom:<lower-cased name>". Client-safe. */
export function subjectRequestKey(subjectId: SubjectId, name: string): string {
  return subjectId.startsWith("custom:") ? `custom:${name.trim().toLowerCase()}` : subjectId;
}
