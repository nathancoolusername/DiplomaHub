import "server-only";

import type {
  AnswerDraft,
  Attempt,
  AttemptAnswer,
  AttemptResult,
  BuildSettings,
  Level,
  Markscheme,
  PracticeSet,
  PracticeType,
  Question,
  PastSet,
  SetSettings,
  RecentSession,
  SetPreview,
  StrengthChange,
  SubjectId,
} from "@/lib/data/types";
import { findSubtopic, subjectById } from "@/lib/catalog";
import { isAnswered } from "@/lib/practice/marking";
import { examPaceSeconds } from "@/lib/practice/pace";
import { levelFor } from "@/lib/practice/strength";
import { check, db, requireUserId, rpc } from "./client";
import { SET_COLUMNS, toAnswer, toAttempt, toMarkscheme, toQuestion, toSet } from "./map";

/* eslint-disable @typescript-eslint/no-explicit-any -- RPC JSON is untyped; map.ts types it */

// ── Sets ────────────────────────────────────────────────────────────────

export async function getSet(setId: string): Promise<PracticeSet | null> {
  const { data, error } = await (await db()).from("practice_sets").select(SET_COLUMNS).eq("id", setId).maybeSingle();
  check(error);
  return data ? toSet(data) : null;
}

/** get_set_questions: the set's questions in order, never with answers. */
export async function getSetQuestions(setId: string): Promise<Question[]> {
  return ((await rpc<any[]>("get_set_questions", { p_set_id: setId })) ?? []).map(toQuestion);
}

export async function saveSet(setId: string): Promise<void> {
  check((await (await db()).from("practice_sets").update({ saved: true }).eq("id", setId)).error);
}

/**
 * Edits a set before starting it (update_set): name, timer / MCQ feedback /
 * answer-on, and dropping or reordering its own questions.
 */
export async function updateSet(
  setId: string,
  edit: { title: string; settings: Pick<SetSettings, "timer" | "mcqFeedback" | "answerOn">; questionIds: string[] },
): Promise<void> {
  await rpc("update_set", { p_set_id: setId, p_title: edit.title, p_settings: edit.settings, p_question_ids: edit.questionIds });
}

/**
 * Deletes one of your sets. Results are stored against the set, so a set
 * you've finished keeps existing (out of My sets, still in Past sets) and
 * only a set with no finished attempts is really deleted (with any
 * unfinished attempt; a scheduled study session loses its Start link).
 */
export async function deleteSet(setId: string): Promise<"deleted" | "removed"> {
  const uid = await requireUserId();
  const sb = await db();
  const finished = await sb
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("set_id", setId)
    .in("status", ["marking", "marked"]);
  check(finished.error);
  if ((finished.count ?? 0) > 0) {
    check((await sb.from("practice_sets").update({ saved: false }).eq("id", setId).eq("owner_id", uid)).error);
    return "removed";
  }
  const { data, error } = await sb.from("practice_sets").delete().eq("id", setId).eq("owner_id", uid).select("id");
  check(error);
  if (!data?.length) throw new Error("Set not found");
  return "deleted";
}

/** Whether there's an unfinished attempt at this set (its questions are then locked). */
export async function hasOpenAttempt(setId: string): Promise<boolean> {
  const uid = await requireUserId();
  const { count, error } = await (await db())
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("set_id", setId)
    .eq("status", "in_progress");
  check(error);
  return (count ?? 0) > 0;
}

/** Changes a set's build settings (rebuild_set): keeps questions that still fit, tops up or trims. */
export async function rebuildSet(setId: string, settings: BuildSettings, title: string | null): Promise<void> {
  await rpc("rebuild_set", { p_set_id: setId, p_settings: settings, p_title: title });
}

/** Names a set (students may update their own sets' title; 1-120 characters). */
export async function renameSet(setId: string, title: string): Promise<void> {
  const name = title.trim().slice(0, 120);
  if (!name) throw new Error("Give the set a name");
  check((await (await db()).from("practice_sets").update({ title: name }).eq("id", setId)).error);
}

export async function unsaveSet(setId: string): Promise<void> {
  check((await (await db()).from("practice_sets").update({ saved: false }).eq("id", setId)).error);
}

/** "My sets", newest first, optionally for one subject. */
export async function getSavedSets(subjectId?: string): Promise<PracticeSet[]> {
  const uid = await requireUserId();
  let query = (await db()).from("practice_sets").select(SET_COLUMNS).eq("owner_id", uid).eq("saved", true);
  if (subjectId) query = query.eq("subject_id", subjectId);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
  check(error);
  return (data ?? []).map(toSet);
}

export async function shareSet(setId: string): Promise<string> {
  return rpc<string>("share_set", { p_set_id: setId });
}

/** redeem_share_code: copies a shared set into "My sets" (rate-limited). */
export async function redeemShareCode(code: string): Promise<PracticeSet> {
  const r = await rpc<{ ok: boolean; set_id?: string; error?: string }>("redeem_share_code", { p_code: code });
  if (!r.ok || !r.set_id) throw new Error(r.error ?? "Couldn't redeem that code");
  const set = await getSet(r.set_id);
  if (!set) throw new Error("Couldn't load the copied set");
  return set;
}

/** Subjects that have bank questions (ids only). */
export async function getSubjectsWithQuestions(): Promise<string[]> {
  return (await rpc<string[]>("subjects_with_questions")) ?? [];
}

// ── Building ────────────────────────────────────────────────────────────

export async function previewSet(subjectId: SubjectId, practiceType: PracticeType, _level: Level, b: BuildSettings): Promise<SetPreview> {
  const p = await rpc<any>("preview_set", { p_subject: subjectId, p_type: practiceType, p_settings: b });
  return {
    matching: p.matching,
    unseen: p.unseen,
    answeredWrong: p.answered_wrong,
    setSize: p.set_size,
    writtenInSet: p.written_in_set,
    marksInSet: p.marks_in_set,
  };
}

/** Go / Save: the database picks the questions and stores the set. */
export async function buildSet(
  subjectId: SubjectId,
  practiceType: PracticeType,
  _level: Level,
  b: BuildSettings,
  options: { writtenCap: number | null; save: boolean },
): Promise<PracticeSet> {
  const id = await rpc<string>("build_set", {
    p_subject: subjectId,
    p_type: practiceType,
    p_settings: b,
    p_written_cap: options.writtenCap,
    p_save: options.save,
  });
  const set = await getSet(id);
  if (!set) throw new Error("Couldn't load the new set");
  return set;
}

export async function createRedoSet(attemptId: string): Promise<PracticeSet> {
  const id = await rpc<string>("create_redo_set", { p_attempt_id: attemptId });
  const set = await getSet(id);
  if (!set) throw new Error("Couldn't load the new set");
  return set;
}

// ── Attempts ────────────────────────────────────────────────────────────

export async function startOrResumeAttempt(setId: string): Promise<{ attempt: Attempt; answers: AttemptAnswer[] }> {
  const r = await rpc<any>("start_attempt", { p_set_id: setId });
  return { attempt: toAttempt(r.attempt), answers: (r.answers ?? []).map(toAnswer) };
}

export async function saveAnswer(attemptId: string, questionId: string, draft: AnswerDraft): Promise<void> {
  await rpc("save_answer", { p_attempt_id: attemptId, p_question_id: questionId, p_draft: draft });
}

/**
 * The right option for each MCQ in an untimed attempt with feedback after
 * every question (migration 23), so the player can show right/wrong at once.
 * Empty for timed and "feedback at the end" attempts.
 */
export async function getInstantMcqKeys(attemptId: string): Promise<Record<string, string>> {
  return (await rpc<Record<string, string>>("instant_mcq_keys", { p_attempt_id: attemptId })) ?? {};
}

export async function revealMarkscheme(attemptId: string, questionId: string): Promise<Markscheme> {
  return toMarkscheme(await rpc<any>("reveal_markscheme", { p_attempt_id: attemptId, p_question_id: questionId }));
}

export async function finishAttempt(attemptId: string): Promise<Attempt> {
  return toAttempt(await rpc<any>("finish_attempt", { p_attempt_id: attemptId }));
}

/** Deletes an unfinished attempt; its set goes too unless it's saved, shared or has other attempts. */
export async function discardAttempt(attemptId: string): Promise<void> {
  await rpc("discard_attempt", { p_attempt_id: attemptId });
}

export async function confirmMarks(
  attemptId: string,
  ticks: Record<string, AttemptAnswer["tickedPoints"]>,
  essayMarks: Record<string, AttemptAnswer["criterionMarks"]> = {},
): Promise<Attempt> {
  return toAttempt(await rpc<any>("confirm_marks", { p_attempt_id: attemptId, p_ticks: ticks, p_essays: essayMarks }));
}

export async function getAttemptResult(attemptId: string): Promise<AttemptResult | null> {
  let r: any;
  try {
    r = await rpc<any>("get_attempt_review", { p_attempt_id: attemptId });
  } catch (e) {
    if ((e as Error).message === "Attempt not found") return null;
    throw e;
  }
  const attempt = toAttempt(r.attempt);
  const set = toSet({ ...r.set, practice_set_questions: (r.items ?? []).map((i: any, n: number) => ({ question_id: i.question.id, position: n })) });
  const subject = subjectById(set.subjectId);
  if (!subject) return null;

  const items = (r.items ?? []).map((i: any) => {
    const question = toQuestion(i.question);
    return {
      question,
      subtopic: findSubtopic(set.subjectId, question.subtopicId) ?? {
        id: question.subtopicId,
        code: question.subtopicId,
        name: question.subtopicId,
        shortName: question.subtopicId,
        hlOnly: false,
      },
      answer: toAnswer(i.answer),
      // Present only once the attempt is finished; before that the page redirects to the player.
      markscheme: i.markscheme ? toMarkscheme(i.markscheme) : (null as unknown as Markscheme),
    };
  });

  const strengthChanges: StrengthChange[] = ((r.attempt.strength_changes ?? []) as any[]).map((c) => ({
    subtopic: findSubtopic(c.subject_id, c.subtopic_code) ?? {
      id: c.subtopic_code,
      code: c.subtopic_code,
      name: c.subtopic_code,
      shortName: c.subtopic_code,
      hlOnly: false,
    },
    before: { score: c.before?.score ?? null, level: levelFor(c.before?.score ?? null, c.before?.answered_count ?? 0) },
    after: { score: c.after?.score ?? null, level: levelFor(c.after?.score ?? null, c.after?.answered_count ?? 0) },
  }));

  let isFirstResult = false;
  if (attempt.status === "marked") {
    const uid = await requireUserId();
    const { count, error } = await (await db()).from("attempts").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "marked");
    check(error);
    isFirstResult = (count ?? 0) <= 1;
  }

  return {
    attempt,
    set,
    subject,
    items,
    marksEarned: items.reduce((s: number, i: any) => s + (i.answer.marksAwarded ?? 0), 0),
    marksPossible: items.reduce((s: number, i: any) => s + i.question.totalMarks, 0),
    timeTakenS: items.reduce((s: number, i: any) => s + i.answer.timeSpentS, 0),
    examPaceS: examPaceSeconds(subject, set.settings.level, items.map((i: any) => i.question)),
    strengthChanges,
    isFirstResult,
  };
}

/** "Past sets": finished sets, newest first, optionally for one subject, with scores once marked. */
export async function getPastSets(options: { subjectId?: string; limit?: number } = {}): Promise<PastSet[]> {
  const uid = await requireUserId();
  let query = (await db())
    .from("attempts")
    .select(`id, set_id, started_at, finished_at, marked_at, status, timed, practice_sets!inner(${SET_COLUMNS})`)
    .eq("user_id", uid)
    .in("status", ["marking", "marked"]);
  if (options.subjectId) query = query.eq("practice_sets.subject_id", options.subjectId);
  const { data, error } = await query.order("finished_at", { ascending: false }).limit(options.limit ?? 20);
  check(error);
  const rows = (data ?? []) as any[];

  const markedIds = rows.filter((r) => r.status === "marked").map((r) => r.id);
  const marks = markedIds.length
    ? await rpc<{ attempt_id: string; earned: number; possible: number }[]>("attempt_marks", { p_attempt_ids: markedIds })
    : [];

  return rows.map((r): PastSet => {
    const m = marks.find((x) => x.attempt_id === r.id);
    return {
      attempt: toAttempt(r),
      set: toSet(r.practice_sets),
      scorePct: r.status === "marked" && m && m.possible ? Math.round((m.earned / m.possible) * 100) : null,
    };
  });
}

/**
 * "Pick up where you left off" (Hub and Practice): unfinished sets only, newest
 * first. A set counts as finished once it reaches the marking/results page,
 * so it's never offered again here.
 */
export async function getRecentSessions(limit = 3): Promise<RecentSession[]> {
  const uid = await requireUserId();
  const { data, error } = await (await db())
    .from("attempts")
    .select(
      `id, set_id, started_at, finished_at, marked_at, status, timed,
      practice_sets(${SET_COLUMNS}),
      attempt_answers(question_id, part_answers, selected_option, on_paper, ticked_points, criterion_marks, time_spent_s, marks_awarded)`,
    )
    .eq("user_id", uid)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(limit);
  check(error);

  return ((data ?? []) as any[]).map((r): RecentSession => {
    const answers = (r.attempt_answers ?? []).map(toAnswer);
    // Question types aren't visible here, so "answered" uses what was typed, picked or ticked.
    const answered = answers.filter((a: AttemptAnswer) =>
      isAnswered({ type: a.selectedOption !== null ? "mcq" : "short" } as Question, a),
    ).length;
    return { attempt: toAttempt(r), set: toSet(r.practice_sets), answered, total: answers.length };
  });
}
