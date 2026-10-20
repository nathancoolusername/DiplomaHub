import type { SubjectId } from "@/lib/data/types";

/**
 * Subtopics that exist in the syllabus but have no questions yet. The topic
 * picker shows them greyed out with a "Coming soon" tag and they can't be ticked.
 * English Paper 1 (guided textual analysis) is feedback-only and arrives later.
 */
export const COMING_SOON_SUBTOPICS: Partial<Record<SubjectId, string[]>> = {
  english_a_lit: ["E.P1"],
  english_a_langlit: ["E.P1"],
};

export function comingSoonIds(subjectId: SubjectId): Set<string> {
  return new Set(COMING_SOON_SUBTOPICS[subjectId] ?? []);
}
