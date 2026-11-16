import "server-only";

import { createAdminClient } from "@/app/lib/supabase/admin";
import { findSubtopic, subjectById } from "@/lib/catalog";
import { toAnswer, toMarkscheme, toQuestion } from "@/lib/data/supabase/map";
import type { SubjectId } from "@/lib/data/types";

// Grounding for Bro: the question a student has open (player, marking or
// results page), with their answer and, when they're allowed to see it,
// the real markscheme. Loaded on the server from the attempt id: the
// attempt must be theirs and the question must be in it, so Bro can never
// be used to read the question bank. The same lock as reveal_markscheme():
// a timed set or an essay still in progress gets the question only.

export type QuestionRef = { attemptId: string; questionId: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function questionRef(v: unknown): QuestionRef | null {
  if (!v || typeof v !== "object") return null;
  const { attemptId, questionId } = v as Record<string, unknown>;
  if (typeof attemptId !== "string" || !UUID.test(attemptId)) return null;
  if (typeof questionId !== "string" || questionId.length > 100) return null;
  return { attemptId, questionId };
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** The question block for Bro and the set's name, or null when it isn't the student's. */
export async function loadQuestionForBro(userId: string, ref: QuestionRef): Promise<{ block: string; setTitle: string } | null> {
  const admin = createAdminClient();
  const { data: attempt } = await admin.from("attempts").select("id, user_id, timed, finished_at, status, set:practice_sets(title)").eq("id", ref.attemptId).maybeSingle();
  if (!attempt || attempt.user_id !== userId) return null;
  const [{ data: row }, { data: ans }] = await Promise.all([
    admin.from("questions").select("*").eq("id", ref.questionId).maybeSingle(),
    admin.from("attempt_answers").select("*").eq("attempt_id", ref.attemptId).eq("question_id", ref.questionId).maybeSingle(),
  ]);
  if (!row || !ans) return null; // not in this attempt

  const setTitle = ((attempt as unknown as { set: { title: string } | null }).set?.title ?? "Practice").slice(0, 70);
  const q = toQuestion(row);
  const answer = toAnswer(ans);
  const finished = !!attempt.finished_at;
  const locked = !finished && (attempt.timed || q.type === "extended");
  const subject = subjectById(q.subjectId as SubjectId)?.shortName ?? q.subjectId;
  const sub = findSubtopic(q.subjectId as SubjectId, q.subtopicId);

  const lines: string[] = [];
  lines.push(
    `The student has this question open (${finished ? "set finished, reviewing it" : "set in progress"}): ${subject}, ${q.paper}, ${q.totalMarks} marks, ${
      q.calculator ? "calculator allowed" : "no calculator"
    }, subtopic ${q.subtopicId}${sub ? ` ${sub.shortName}` : ""}, ${q.type === "mcq" ? "multiple choice" : q.type === "extended" ? "essay" : "written"}.`,
  );
  lines.push("QUESTION:");
  if (q.stemMd) lines.push(clip(q.stemMd, 4000));
  for (const p of q.parts) lines.push(`(${p.label}) [${p.marks} mark${p.marks === 1 ? "" : "s"}] ${clip(p.textMd, 2000)}`);
  if (q.options) for (const o of q.options) lines.push(`Option ${o.key}: ${clip(o.textMd, 500)}`);
  if (q.figures?.length) lines.push(`(The question has ${q.figures.length} diagram${q.figures.length === 1 ? "" : "s"} you can't see.)`);

  const theirs: string[] = [];
  if (answer.selectedOption) theirs.push(`chose option ${answer.selectedOption}`);
  // Essays get room for the whole essay (about 2,000 words); written answers 2,000 characters a part.
  const room = q.type === "extended" ? 14000 : 2000;
  for (const [label, text] of Object.entries(answer.partAnswers)) if (text?.trim() && label !== "__plan") theirs.push(`(${label}) ${clip(text.trim(), room)}`);
  const plan = answer.partAnswers.__plan?.trim();
  if (plan) theirs.push(`Their plan: ${clip(plan, 2000)}`);
  if (answer.onPaper) theirs.push("worked on paper (not typed here)");
  lines.push(theirs.length ? `THEIR ANSWER: ${theirs.join("\n")}` : "THEIR ANSWER: nothing typed yet.");
  if (answer.marksAwarded !== null) lines.push(`MARKS: ${answer.marksAwarded}/${q.totalMarks}${answer.markedBy === "self" ? " (they marked it themselves)" : ""}.`);

  if (locked) {
    lines.push(
      "MARKSCHEME: locked. This is a timed set or an essay that isn't finished yet, so the markscheme only unlocks when they finish. Don't give or work out the answer: hints about the method only.",
    );
    return { block: lines.join("\n"), setTitle };
  }

  const ms = toMarkscheme(row);
  lines.push("MARKSCHEME (the official one for this question; ground your help in it):");
  if (ms.correctOption) lines.push(`Correct option: ${ms.correctOption}`);
  for (const p of ms.parts) {
    const ticked = answer.tickedPoints[p.label] ?? [];
    lines.push(`(${p.label}) Answer: ${clip(p.answerMd, 1500)}`);
    if (p.markschemeMd) lines.push(clip(p.markschemeMd, 2500));
    p.markPoints.forEach((m, i) =>
      lines.push(`  ${m.implied ? `(${m.code})` : m.code}: ${clip(m.text, 600)}${m.note ? ` [note: ${clip(m.note, 300)}]` : ""}${answer.marksAwarded !== null ? (ticked.includes(i) ? " ✓ awarded" : " ✗ not awarded") : ""}`),
    );
  }
  if (ms.criteria) for (const c of ms.criteria) lines.push(`Criterion ${clip(JSON.stringify(c), 800)}`);
  if (ms.feedbackPoints?.length) lines.push(`A strong answer includes: ${ms.feedbackPoints.map((f) => clip(f, 300)).join("; ")}`);
  if (ms.workedSolutionMd) lines.push(`WORKED SOLUTION: ${clip(ms.workedSolutionMd, 4000)}`);
  return { block: lines.join("\n"), setTitle };
}
