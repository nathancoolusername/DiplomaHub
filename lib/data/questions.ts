// The three shapes a question passes through, and the mappers between them:
//
//   ExportQuestion  — a file from the pipeline's export/ folder (schema v2)
//        │ exportToRow()        ← used by the importer that fills Supabase
//        ▼
//   QuestionRow     — one row of the `questions` table
//        │ rowToQuestion()      ← safe for the browser: no answers
//        │ rowToMarkscheme()    ← only via reveal_markscheme
//        ▼
//   Question / Markscheme (lib/data/types.ts)
//
// The mock layer runs the very same chain on local JSON, so swapping in
// Supabase only replaces where QuestionRow comes from.
//
// No "server-only" here so a Node import script can reuse exportToRow, but
// nothing in this file should ever be imported by a client component.

import { sanitizeFigures } from "./figures.ts";
import type { EssayCriterion, Markscheme, MarkPoint, PaperCode, Question, QuestionType, SubjectId } from "./types";

/** Pipeline export format, schema v2 (see the pipeline's export/<subject>/SCHEMA.md). */
export type ExportQuestion = {
  id: string;
  schema_version: 2;
  subject: string; // "math-aa"
  type: QuestionType;
  hl_only: boolean;
  topic: string;
  subtopic: string;
  skills: string[];
  paper_type: PaperCode;
  calculator: boolean;
  difficulty: number;
  total_marks: number;
  stem_md: string;
  parts: {
    label: string;
    marks: number;
    text_md: string;
    answer: string;
    markscheme_md: string;
    mark_points: MarkPoint[];
  }[];
  worked_solution_md: string;
  has_diagram: boolean;
  /** Inline SVG diagrams shown after the stem (needs has_diagram: true). */
  figures?: { svg: string; alt: string }[];
  /** MCQ only. Not in schema v2 yet; matches the build spec's options/correct_option columns. */
  options?: { key: string; text_md: string }[];
  correct_option?: string;
  /** Essays only: criteria with markbands, and what a strong answer includes. */
  criteria?: { name: string; max_marks: number; bands: { min: number; max: number; descriptor: string }[] }[];
  feedback_points?: string[];
  /** Questions in the same subtopic that differ only in numbers/wording share a group (pipeline scripts/variant_groups.py). */
  variant_group?: string;
  /** Server-only: dropped by exportToRow except for its status. */
  verification: { status: "verified" | "needs_review" | "rejected" } & Record<string, unknown>;
};

/**
 * One row of `questions`. Prompt and answers live in separate columns so
 * get_set_questions can return `parts` without ever selecting `markscheme`.
 */
export type QuestionRow = {
  id: string;
  subject_id: SubjectId;
  topic_code: string;
  subtopic_code: string;
  type: QuestionType;
  paper: PaperCode;
  calculator: boolean;
  hl_only: boolean;
  difficulty: number;
  marks: number;
  skills: string[];
  stem_md: string;
  parts: { label: string; marks: number; text_md: string }[];
  options: { key: string; text_md: string }[] | null;
  figures: { svg: string; alt: string }[] | null;
  /** Family of near-identical questions; dp_candidates picks round-robin across families (migration 30). */
  variant_group?: string | null;
  // ── answer columns: never sent to a client except via reveal_markscheme
  correct_option: string | null;
  markscheme: {
    label: string;
    answer_md: string;
    markscheme_md: string;
    mark_points: MarkPoint[];
  }[];
  worked_solution_md: string;
  criteria: { name: string; max_marks: number; bands: { min: number; max: number; descriptor: string }[] }[] | null;
  feedback_points: string[] | null;
  // ── server-only
  status: "pending" | "verified" | "rejected";
  owner_id: string | null; // null = shared bank
  created_by: "pipeline" | "generation" | "student";
};

/** Pipeline subject slugs → app subject ids (the Hub's ids). */
const SUBJECT_ID_BY_EXPORT_SLUG: Record<string, SubjectId> = {
  "math-aa": "math_aa",
  economics: "economics",
  history: "history",
  "english-a": "english_a_langlit", // English A: Language & Literature
  physics: "physics",
  chemistry: "chemistry",
  biology: "biology",
  geography: "geography",
  business: "business",
  "math-ai": "math_ai",
};

/** Science exports keep Paper 1A (MCQ) and 1B (data-based): the catalog lists them as papers (migration 16). */
const PAPER_CODES: PaperCode[] = ["P1", "P1A", "P1B", "P2", "P3"];
const toPaperCode = (paper: string): PaperCode => {
  if (!PAPER_CODES.includes(paper as PaperCode)) throw new Error(`Unknown paper "${paper}"`);
  return paper as PaperCode;
};

export function exportToRow(q: ExportQuestion): QuestionRow {
  const subjectId = SUBJECT_ID_BY_EXPORT_SLUG[q.subject];
  if (!subjectId) throw new Error(`Unknown export subject "${q.subject}"`);
  return {
    id: q.id,
    subject_id: subjectId,
    topic_code: q.topic,
    subtopic_code: q.subtopic,
    type: q.type,
    paper: toPaperCode(q.paper_type),
    calculator: q.calculator,
    hl_only: q.hl_only,
    difficulty: q.difficulty,
    marks: q.total_marks,
    skills: q.skills,
    stem_md: q.stem_md,
    parts: q.parts.map((p) => ({ label: p.label, marks: p.marks, text_md: p.text_md })),
    options: q.options ?? null,
    figures: q.figures?.length ? sanitizeFigures(q.figures) : null,
    variant_group: q.variant_group ?? null,
    correct_option: q.correct_option ?? null,
    markscheme: q.parts.map((p) => ({
      label: p.label,
      answer_md: p.answer,
      markscheme_md: p.markscheme_md,
      mark_points: p.mark_points.map(({ code, marks, implied, text, note }) => ({
        code,
        marks,
        implied,
        text,
        ...(note ? { note } : {}),
      })),
    })),
    worked_solution_md: q.worked_solution_md,
    criteria: q.criteria ?? null,
    feedback_points: q.feedback_points ?? null,
    status: q.verification.status === "needs_review" ? "pending" : q.verification.status,
    owner_id: null,
    created_by: "pipeline",
  };
}

export function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subtopicId: row.subtopic_code,
    type: row.type,
    paper: row.paper,
    calculator: row.calculator,
    hlOnly: row.hl_only,
    difficulty: Math.min(5, Math.max(1, Math.round(row.difficulty))) as Question["difficulty"],
    totalMarks: row.marks,
    stemMd: row.stem_md,
    parts: row.parts.map((p) => ({ label: p.label, marks: p.marks, textMd: p.text_md })),
    options: row.options?.map((o) => ({ key: o.key, textMd: o.text_md })) ?? null,
    figures: sanitizeFigures(row.figures),
  };
}

export function rowToMarkscheme(row: QuestionRow): Markscheme {
  return {
    questionId: row.id,
    parts: row.markscheme.map((p) => ({
      label: p.label,
      answerMd: p.answer_md,
      markschemeMd: p.markscheme_md,
      markPoints: p.mark_points,
    })),
    correctOption: row.correct_option,
    workedSolutionMd: row.worked_solution_md,
    criteria:
      row.criteria?.map((c): EssayCriterion => ({ name: c.name, maxMarks: c.max_marks, bands: c.bands })) ?? null,
    feedbackPoints: row.feedback_points,
  };
}
