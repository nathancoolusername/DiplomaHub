// Marking rules shared by the player (live tallies) and the server (the
// marks that are actually saved). Pure functions over domain types.

import type { AttemptAnswer, Markscheme, PartMarkscheme, Question } from "@/lib/data/types";

export function partMarks(part: PartMarkscheme, ticked: number[] | undefined): number {
  if (!ticked) return 0;
  const total = ticked.reduce((sum, i) => sum + (part.markPoints[i]?.marks ?? 0), 0);
  return Math.min(total, part.markPoints.reduce((s, p) => s + p.marks, 0));
}

export function tickedMarks(markscheme: Markscheme, ticked: AttemptAnswer["tickedPoints"]): number {
  return markscheme.parts.reduce((sum, part) => sum + partMarks(part, ticked[part.label]), 0);
}

/** Essays: the sum of the marks chosen per criterion, each capped at its maximum. */
export function essayMarks(markscheme: Markscheme, chosen: Record<string, number>): number {
  return (markscheme.criteria ?? []).reduce((sum, c) => sum + Math.max(0, Math.min(c.maxMarks, chosen[c.name] ?? 0)), 0);
}

/** The planning pad is stored with the answers under this key; it isn't an answer. */
export const PLAN_KEY = "__plan";

/** MCQ: full marks for the right option, nothing otherwise. */
export function mcqMarks(question: Question, markscheme: Markscheme, selected: string | null): number {
  return selected !== null && selected === markscheme.correctOption ? question.totalMarks : 0;
}

/** Seconds on a question before an "answered on paper" question counts as done. */
export const PAPER_ANSWERED_AFTER_S = 5;

export function isAnswered(
  question: Question,
  answer: Pick<AttemptAnswer, "partAnswers" | "selectedOption" | "onPaper" | "tickedPoints" | "timeSpentS"> | undefined,
): boolean {
  if (!answer) return false;
  if (question.type === "mcq") return answer.selectedOption !== null;
  return (
    // On paper there is nothing to see, so time spent on it stands in.
    (answer.onPaper && answer.timeSpentS >= PAPER_ANSWERED_AFTER_S) ||
    Object.entries(answer.partAnswers).some(([k, t]) => k !== PLAN_KEY && t.trim() !== "") ||
    Object.values(answer.tickedPoints).some((t) => t.length > 0)
  );
}
