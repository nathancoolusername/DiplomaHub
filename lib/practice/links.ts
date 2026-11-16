// Every DiplomaPro URL is built here from ids, so suggestions (rule-based
// or from Bro) can never point anywhere that doesn't exist.

import type { PracticeType, SubjectId, SuggestionAction } from "@/lib/data/types";

export const links = {
  practice: () => "/practice",
  subject: (subjectId: SubjectId) => `/practice/${subjectId}`,
  build: (subjectId: SubjectId, type: PracticeType, subtopicIds: string[] = []) => {
    const base = `/practice/${subjectId}/build/${type}`;
    return subtopicIds.length ? `${base}?topics=${subtopicIds.map(encodeURIComponent).join(",")}` : base;
  },
  /** Your sets: My sets and every past set, with PDF, redo and scheduling. */
  sets: () => "/practice/sets",
  play: (setId: string) => `/practice/sets/${setId}/play`,
  /** A printed paper back on screen: put in the circled letters, then mark it against the markscheme. */
  markPaper: (setId: string) => `/practice/sets/${setId}/mark`,
  /** The set as a printable DiplomaHub paper (Save as PDF from the print dialog). */
  pdf: (setId: string) => `/practice/sets/${setId}/pdf`,
  /** A saved set opened in "Build your set" to change its settings. */
  editSet: (set: { id: string; subjectId: SubjectId; practiceType: PracticeType }) =>
    `/practice/${set.subjectId}/build/${set.practiceType}?set=${encodeURIComponent(set.id)}`,
  /** Reorder or remove a set's questions. */
  setQuestions: (setId: string) => `/practice/sets/${setId}`,
  attempt: (attemptId: string) => `/practice/attempts/${attemptId}`,
  hub: () => "/hub",
  plans: () => "/pro",
  /** Sharing codes: redeem, what can be shared, my codes. `code` pre-fills the box. */
  codes: (code?: string) => (code ? `/codes?c=${encodeURIComponent(code)}` : "/codes"),
};

export function suggestionHref(action: SuggestionAction): string {
  switch (action.type) {
    case "practice":
      return links.build(action.subjectId, action.practiceType, action.subtopicIds);
    case "subject":
      return links.subject(action.subjectId);
    case "add_item":
      return `${links.hub()}?add=1`;
    case "plan_time":
      return `${links.hub()}?plan=${encodeURIComponent(action.itemId)}`;
  }
}
