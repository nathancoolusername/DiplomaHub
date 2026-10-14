import type { PracticeType } from "@/lib/data/types";

export const PRACTICE_TYPES: Record<PracticeType, { title: string; description: string; pro: boolean }> = {
  mcq_short: {
    title: "MCQ & short answer",
    description: "Quick or structured questions by topic, marked against the markscheme.",
    pro: false,
  },
  essay: {
    title: "Essays",
    description: "Extended-response prompts with markbands to plan and write against.",
    pro: false,
  },
  mock: {
    title: "Full mock paper",
    description: "A complete timed paper at exam pace, marked at the end.",
    pro: false,
  },
  grade_own: {
    title: "Grade your own work",
    description: "Upload a photo of a paper you did, or write your own questions, and have Bro mark them.",
    pro: true,
  },
};

/** Display order of the practice boxes. */
export const PRACTICE_TYPE_ORDER: PracticeType[] = ["mcq_short", "essay", "mock", "grade_own"];
