// Progress: the results students log (student_results, migration 41).
// Shared by the server and the /progress page, so no server-only imports.

import { GENERIC, gradeFromPercent, type Boundaries } from "./grade-boundaries";

export const RESULT_KINDS = ["test", "mock", "ia_ee", "predicted", "term", "other"] as const;
export type ResultKind = (typeof RESULT_KINDS)[number];

export const RESULT_KIND_LABEL: Record<ResultKind, string> = {
  test: "Class test",
  mock: "Mock",
  ia_ee: "IA / EE draft",
  predicted: "Predicted grade",
  term: "End of term",
  other: "Other",
};

export type StudentResult = {
  id: string;
  subjectId: string;
  title: string;
  kind: ResultKind;
  /** YYYY-MM-DD */
  takenOn: string;
  grade: number | null;
  marks: number | null;
  maxMarks: number | null;
  percent: number | null;
  hubItemId: string | null;
  note: string | null;
  source: "student" | "bro";
};

export type ResultInput = {
  subjectId: string;
  title: string;
  kind: ResultKind;
  takenOn: string;
  grade?: number | null;
  marks?: number | null;
  maxMarks?: number | null;
  percent?: number | null;
  hubItemId?: string | null;
  note?: string | null;
};

/** The percentage a result stands for: as logged, or from marks; null for a bare grade. */
export function resultPercent(r: Pick<StudentResult, "percent" | "marks" | "maxMarks">): number | null {
  if (r.percent !== null) return r.percent;
  if (r.marks !== null && r.maxMarks) return (r.marks / r.maxMarks) * 100;
  return null;
}

/**
 * The 1–7 grade for charts: the IB grade when logged, otherwise an estimate
 * from the percentage using that subject's recent overall boundaries
 * (lib/grade-boundaries.ts). Estimates are marked wherever they show.
 */
export function chartGrade(
  r: Pick<StudentResult, "grade" | "percent" | "marks" | "maxMarks">,
  boundaries: Boundaries = GENERIC,
): { grade: number; estimated: boolean } | null {
  if (r.grade !== null) return { grade: r.grade, estimated: false };
  const p = resultPercent(r);
  if (p === null) return null;
  return { grade: gradeFromPercent(p, boundaries), estimated: true };
}

/** "6", "61/80 (76%)", "72.5%": what was logged, for lists and Bro. */
export function describeResult(r: Pick<StudentResult, "grade" | "percent" | "marks" | "maxMarks">): string {
  const parts: string[] = [];
  if (r.grade !== null) parts.push(`grade ${r.grade}`);
  if (r.marks !== null && r.maxMarks !== null) parts.push(`${fmt(r.marks)}/${fmt(r.maxMarks)} (${Math.round((r.marks / r.maxMarks) * 100)}%)`);
  else if (r.percent !== null) parts.push(`${fmt(r.percent)}%`);
  return parts.join(", ");
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
}

export type ResultCheck = { ok: true; value: Required<Omit<ResultInput, "hubItemId" | "note">> & { hubItemId: string | null; note: string | null } } | { ok: false; reason: string };

/** Cleans and checks a result before it's saved (the database checks again). */
export function checkResult(input: Partial<Record<keyof ResultInput, unknown>>, subjectIds: string[]): ResultCheck {
  const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
  const subjectId = typeof input.subjectId === "string" ? input.subjectId : "";
  if (!subjectIds.includes(subjectId)) return { ok: false, reason: "Pick one of your subjects." };
  const title = typeof input.title === "string" ? input.title.replace(/\s+/g, " ").trim() : "";
  if (!title) return { ok: false, reason: "Give it a name, e.g. \"Unit 3 test\"." };
  if (title.length > 80) return { ok: false, reason: "Keep the name under 80 characters." };
  const kind = (RESULT_KINDS as readonly string[]).includes(input.kind as string) ? (input.kind as ResultKind) : "test";
  const takenOn = typeof input.takenOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.takenOn) ? input.takenOn : "";
  const t = Date.parse(`${takenOn}T00:00:00Z`);
  if (!takenOn || Number.isNaN(t) || t < Date.UTC(2015, 0, 1) || t > Date.now() + 366 * 86_400_000) return { ok: false, reason: "Pick a valid date." };
  const grade = num(input.grade);
  const marks = num(input.marks);
  const maxMarks = num(input.maxMarks);
  const percent = num(input.percent);
  if (grade !== null && (!Number.isInteger(grade) || grade < 1 || grade > 7)) return { ok: false, reason: "IB grades go from 1 to 7." };
  if ((marks === null) !== (maxMarks === null)) return { ok: false, reason: "Give both your marks and the total." };
  if (marks !== null && maxMarks !== null && (!(maxMarks > 0) || !(marks >= 0) || marks > maxMarks || maxMarks > 99999)) return { ok: false, reason: "Marks must be between 0 and the total." };
  if (percent !== null && !(percent >= 0 && percent <= 100)) return { ok: false, reason: "A percentage goes from 0 to 100." };
  if (grade === null && marks === null && percent === null) return { ok: false, reason: "Add a grade, your marks or a percentage." };
  const note = typeof input.note === "string" && input.note.trim() ? input.note.trim().slice(0, 300) : null;
  const hubItemId = typeof input.hubItemId === "string" && input.hubItemId.length <= 100 ? input.hubItemId : null;
  return { ok: true, value: { subjectId, title, kind, takenOn, grade, marks, maxMarks, percent, hubItemId, note } };
}
