import "server-only";

import { sanitizeFigures } from "@/lib/data/figures";
import type { Attempt, AttemptAnswer, EssayCriterion, Markscheme, MarkPoint, PracticeSet, Question } from "@/lib/data/types";

// Database JSON (snake_case, from RPCs and selects) → the app's types.

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come untyped from PostgREST/RPC JSON */

export function toQuestion(j: any): Question {
  return {
    id: j.id,
    subjectId: j.subject_id,
    subtopicId: j.subtopic_code,
    type: j.type,
    paper: j.paper,
    calculator: !!j.calculator,
    hlOnly: !!j.hl_only,
    difficulty: Math.min(5, Math.max(1, j.difficulty)) as Question["difficulty"],
    totalMarks: j.marks,
    stemMd: j.stem_md ?? "",
    parts: (j.parts ?? []).map((p: any) => ({ label: p.label, marks: p.marks, textMd: p.text_md })),
    options: j.options ? j.options.map((o: any) => ({ key: o.key, textMd: o.text_md })) : null,
    figures: sanitizeFigures(j.figures),
  };
}

export function toMarkscheme(j: any): Markscheme {
  return {
    questionId: j.question_id,
    parts: (j.markscheme ?? []).map((p: any) => ({
      label: p.label,
      answerMd: p.answer_md ?? "",
      markschemeMd: p.markscheme_md ?? "",
      markPoints: (p.mark_points ?? []) as MarkPoint[],
    })),
    correctOption: j.correct_option ?? null,
    workedSolutionMd: j.worked_solution_md ?? "",
    criteria: j.criteria ? j.criteria.map((c: any): EssayCriterion => ({ name: c.name, maxMarks: c.max_marks, bands: c.bands })) : null,
    feedbackPoints: j.feedback_points ?? null,
  };
}

export function toAttempt(j: any): Attempt {
  return {
    id: j.id,
    setId: j.set_id,
    startedAt: j.started_at,
    finishedAt: j.finished_at ?? null,
    markedAt: j.marked_at ?? null,
    status: j.status,
    timed: !!j.timed,
  };
}

export function toAnswer(j: any): AttemptAnswer {
  return {
    questionId: j.question_id,
    partAnswers: j.part_answers ?? {},
    selectedOption: j.selected_option ?? null,
    onPaper: !!j.on_paper,
    tickedPoints: j.ticked_points ?? {},
    criterionMarks: j.criterion_marks ?? {},
    marksAwarded: j.marks_awarded ?? null,
    markedBy: j.marked_by ?? null,
    flagged: !!j.flagged,
    timeSpentS: j.time_spent_s ?? 0,
    revealed: !!j.revealed,
  };
}

/** A practice_sets row selected with `practice_set_questions(question_id, position)`. */
export function toSet(row: any): PracticeSet {
  const questions = [...(row.practice_set_questions ?? [])].sort((a: any, b: any) => a.position - b.position);
  return {
    id: row.id,
    title: row.title,
    subjectId: row.subject_id,
    practiceType: row.practice_type,
    settings: row.settings,
    questionIds: questions.map((q: any) => q.question_id),
    shareCode: row.share_code ?? null,
    saved: row.saved ?? false,
    build: row.settings?.build ?? null,
  };
}

export const SET_COLUMNS = "id, title, subject_id, practice_type, settings, share_code, saved, created_at, practice_set_questions(question_id, position)";
