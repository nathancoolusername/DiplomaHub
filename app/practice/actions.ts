"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AnswerDraft, AttemptAnswer, BuildSettings, Level, Markscheme, PracticeType, SetPreview, SubjectId } from "@/lib/data/types";
import {
  addExtraClass,
  buildSet,
  getUserSubject,
  previewSet,
  redeemShareCode,
  confirmMarks,
  createRedoSet,
  getAttemptResult,
  getSetQuestions,
  startOrResumeAttempt,
  finishAttempt,
  discardAttempt,
  completeScheduledSet,
  scheduleSet,
  getViewer,
  requirePro,
  removeExtraClass,
  setSubjectLevel,
  requestSubject,
  revealMarkscheme,
  saveAnswer,
  saveSet,
  unsaveSet,
  renameSet,
  updateSet,
  rebuildSet,
  deleteSet,
  setCoreSubjects,
  shareSet,
  type SubjectChoice,
} from "@/lib/data";
import { links } from "@/lib/practice/links";

// Thin wrappers. Server actions are reachable by direct POST, so each one
// starts with getViewer(), which throws for signed-out callers; ownership is
// then enforced by RLS and the database functions themselves.

export async function saveAnswerAction(attemptId: string, questionId: string, draft: AnswerDraft): Promise<void> {
  await getViewer();
  await saveAnswer(attemptId, questionId, draft);
}

export async function revealMarkschemeAction(attemptId: string, questionId: string): Promise<Markscheme> {
  await getViewer();
  return revealMarkscheme(attemptId, questionId);
}

export async function finishAttemptAction(attemptId: string): Promise<never> {
  await getViewer();
  const attempt = await finishAttempt(attemptId);
  // Tick off any study session scheduled for this set; never block finishing on it.
  await completeScheduledSet(attempt.setId).catch(() => {});
  revalidatePath("/hub");
  redirect(links.attempt(attemptId));
}

/**
 * A printed paper back on screen (its code, or Mark paper): the letters
 * circled for the multiple-choice questions are saved, every blank written
 * answer counts as "on paper", and the attempt is finished, so the student
 * lands on the markscheme to tick their marks. An unfinished attempt of the
 * set carries on: anything typed there stays.
 */
export async function markPaperAction(setId: string, mcq: Record<string, string>): Promise<{ href: string }> {
  await getViewer();
  const [questions, { attempt, answers }] = await Promise.all([getSetQuestions(setId), startOrResumeAttempt(setId)]);
  const byId = new Map(answers.map((a) => [a.questionId, a]));
  await Promise.all(
    questions.map((q) => {
      const a = byId.get(q.id);
      if (a && a.marksAwarded !== null) return null; // already marked during the set
      const draft: AnswerDraft = {
        partAnswers: a?.partAnswers ?? {},
        selectedOption: a?.selectedOption ?? null,
        onPaper: a?.onPaper ?? false,
        tickedPoints: a?.tickedPoints ?? {},
        criterionMarks: a?.criterionMarks ?? {},
        flagged: a?.flagged ?? false,
        timeSpentS: a?.timeSpentS ?? 0,
      };
      if (q.type === "mcq") {
        const pick = mcq[q.id];
        if (!pick || !q.options?.some((o) => o.key === pick) || pick === draft.selectedOption) return null;
        return saveAnswer(attempt.id, q.id, { ...draft, selectedOption: pick });
      }
      const typed = Object.values(draft.partAnswers).some((t) => t?.trim());
      return typed || draft.onPaper ? null : saveAnswer(attempt.id, q.id, { ...draft, onPaper: true });
    }),
  );
  await finishAttempt(attempt.id);
  await completeScheduledSet(setId).catch(() => {});
  revalidatePath("/hub");
  revalidatePath("/practice", "layout");
  // Returned, not redirect(): the page navigates, so its error handling only sees real failures.
  return { href: links.attempt(attempt.id) };
}

/** Deletes an unfinished set from "Pick up where you left off" (Hub and Practice). */
export async function discardAttemptAction(attemptId: string): Promise<void> {
  await getViewer();
  await discardAttempt(attemptId);
  revalidatePath("/hub");
  revalidatePath("/practice", "layout");
}

export async function confirmMarksAction(
  attemptId: string,
  ticks: Record<string, AttemptAnswer["tickedPoints"]>,
  essayMarks: Record<string, AttemptAnswer["criterionMarks"]> = {},
): Promise<void> {
  await getViewer();
  await confirmMarks(attemptId, ticks, essayMarks);
}

export async function redoWrongAction(attemptId: string): Promise<never> {
  await getViewer();
  const set = await createRedoSet(attemptId);
  redirect(links.play(set.id));
}

export async function saveSetAction(setId: string): Promise<void> {
  await getViewer();
  await saveSet(setId);
}

/** Renames a set the student owns (RLS keeps it to their own). */
export async function renameSetAction(setId: string, name: string): Promise<void> {
  await getViewer();
  await renameSet(setId, name);
  revalidatePath("/practice", "layout");
  revalidatePath("/hub");
}

/** Saves edits to a set before starting it; with `thenStart`, opens the player. */
export async function updateSetAction(
  setId: string,
  edit: Parameters<typeof updateSet>[1],
  thenStart = false,
): Promise<void> {
  await getViewer();
  await updateSet(setId, edit);
  revalidatePath("/practice", "layout");
  revalidatePath("/hub");
  if (thenStart) redirect(links.play(setId));
}

/** Saves new build settings for a set (and its name); with `thenStart`, opens the player. */
export async function rebuildSetAction(setId: string, settings: BuildSettings, name: string | null, thenStart = false): Promise<void> {
  await getViewer();
  await rebuildSet(setId, settings, name?.trim() || null);
  revalidatePath("/practice", "layout");
  revalidatePath("/hub");
  if (thenStart) redirect(links.play(setId));
}

/** Deletes a set (or, if it has results, just takes it out of My sets). */
export async function deleteSetAction(setId: string): Promise<"deleted" | "removed"> {
  await getViewer();
  const r = await deleteSet(setId);
  revalidatePath("/practice", "layout");
  revalidatePath("/hub");
  revalidatePath("/");
  return r;
}

/** The student's name for a new set, if they typed one; otherwise the built-in title stays. */
async function applyName<T extends { id: string; title: string }>(set: T, name?: string | null): Promise<T> {
  const clean = name?.trim().slice(0, 120);
  if (!clean || clean === set.title) return set;
  await renameSet(set.id, clean);
  return { ...set, title: clean };
}

export async function unsaveSetAction(setId: string): Promise<void> {
  await getViewer();
  await unsaveSet(setId);
}

export async function shareSetAction(setId: string): Promise<string> {
  await getViewer();
  return shareSet(setId);
}

// ── subjects (user_subjects) ─────────────────────────────────────────────

export async function setCoreSubjectsAction(core: SubjectChoice[]): Promise<void> {
  await getViewer();
  await setCoreSubjects(core);
  revalidatePath("/practice", "layout");
}

export async function addExtraClassAction(choice: SubjectChoice): Promise<void> {
  await getViewer();
  await addExtraClass(choice);
  revalidatePath("/practice", "layout");
}

export async function setSubjectLevelAction(subjectId: SubjectId, level: Level): Promise<void> {
  await getViewer();
  await setSubjectLevel(subjectId, level);
  revalidatePath("/practice", "layout");
}

export async function removeExtraClassAction(subjectId: SubjectId): Promise<void> {
  await getViewer();
  await removeExtraClass(subjectId);
  revalidatePath("/practice", "layout");
}

// ── Build your set ───────────────────────────────────────────────────────

async function subjectLevel(subjectId: SubjectId): Promise<Level> {
  const us = await getUserSubject(subjectId);
  if (!us) throw new Error("You don't take this subject");
  return us.level;
}

export async function previewSetAction(subjectId: SubjectId, practiceType: PracticeType, settings: BuildSettings): Promise<SetPreview> {
  await getViewer();
  return previewSet(subjectId, practiceType, await subjectLevel(subjectId), settings);
}

/** Go: builds the set and opens the player. Practice is free with no limit. */
export async function goAction(subjectId: SubjectId, practiceType: PracticeType, settings: BuildSettings, name: string | null = null): Promise<never> {
  await getViewer();
  const level = await subjectLevel(subjectId);
  const set = await applyName(await buildSet(subjectId, practiceType, level, settings, { writtenCap: null, save: false }), name);
  redirect(links.play(set.id));
}

export async function saveBuiltSetAction(
  subjectId: SubjectId,
  practiceType: PracticeType,
  settings: BuildSettings,
  name: string | null = null,
): Promise<{ setId: string; title: string }> {
  await getViewer();
  const set = await applyName(await buildSet(subjectId, practiceType, await subjectLevel(subjectId), settings, { writtenCap: null, save: true }), name);
  return { setId: set.id, title: set.title };
}

/**
 * Schedule (Pro): saves the set to My sets (or reuses `setId` when these
 * settings were already saved) and adds a study session to the Hub that opens it.
 */
export async function scheduleSetAction(
  subjectId: SubjectId,
  practiceType: PracticeType,
  settings: BuildSettings,
  slot: { title: string; startAt: string; endAt: string },
  setId: string | null = null,
  name: string | null = null,
): Promise<{ setId: string; title: string; itemId: string }> {
  await requirePro("Scheduling is part of DiplomaPro");
  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) throw new Error("Pick a start and end time");
  if (end.getTime() - start.getTime() > 8 * 3600_000) throw new Error("A session can be at most 8 hours");

  const set = setId
    ? { setId, title: slot.title }
    : await (async () => {
        const built = await applyName(await buildSet(subjectId, practiceType, await subjectLevel(subjectId), settings, { writtenCap: null, save: true }), name);
        return { setId: built.id, title: built.title };
      })();
  const title = slot.title.trim().slice(0, 200) || set.title;
  const itemId = await scheduleSet(set.setId, { title, subjectId, startAt: start.toISOString(), endAt: end.toISOString() });
  revalidatePath("/hub");
  revalidatePath("/");
  return { setId: set.setId, title, itemId };
}

/** Schedule (Pro) for a set already in My sets: a study session on the Hub that opens it. */
/** A Hub slot from a Schedule dialog: real times, at most 8 hours, a title. */
function checkSlot(slot: { title: string; startAt: string; endAt: string }) {
  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) throw new Error("Pick a start and end time");
  if (end.getTime() - start.getTime() > 8 * 3600_000) throw new Error("A session can be at most 8 hours");
  return { title: String(slot.title ?? "").trim().slice(0, 200) || "Practice set", startAt: start.toISOString(), endAt: end.toISOString() };
}

export async function scheduleSavedSetAction(setId: string, slot: { title: string; startAt: string; endAt: string }): Promise<{ title: string; itemId: string }> {
  await requirePro("Scheduling is part of DiplomaPro");
  if (typeof setId !== "string" || !setId) throw new Error("Set not found");
  const clean = checkSlot(slot);
  const itemId = await scheduleSet(setId, clean);
  revalidatePath("/hub");
  revalidatePath("/");
  return { title: clean.title, itemId };
}

/**
 * Schedule a redo from the results page (Pro): the questions they lost marks
 * on (a new redo set) or the whole set again, saved to My sets and put on
 * the Hub as a study session that opens it.
 */
export async function scheduleRedoAction(
  attemptId: string,
  which: "wrong" | "all",
  slot: { title: string; startAt: string; endAt: string },
): Promise<{ title: string; itemId: string; setId: string }> {
  await requirePro("Scheduling is part of DiplomaPro");
  const clean = checkSlot(slot);
  const result = await getAttemptResult(attemptId);
  if (!result || result.attempt.status !== "marked") throw new Error("Set not found");
  const setId = which === "wrong" ? (await createRedoSet(attemptId)).id : result.set.id;
  await saveSet(setId);
  const itemId = await scheduleSet(setId, clean);
  revalidatePath("/hub");
  revalidatePath("/");
  revalidatePath("/practice", "layout");
  return { title: clean.title, itemId, setId };
}

export async function redeemCodeAction(code: string): Promise<{ ok: true; setId: string; title: string } | { ok: false; error: string }> {
  await getViewer();
  try {
    const set = await redeemShareCode(code);
    return { ok: true, setId: set.id, title: set.title };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't redeem that code" };
  }
}

/** "Request this subject": records that the student wants practice here (no questions yet). */
export async function requestSubjectAction(subjectId: SubjectId, level: Level): Promise<void> {
  const us = await getUserSubject(subjectId);
  if (!us) throw new Error("You don't take this subject");
  await requestSubject(subjectId, us.subject.name, level);
  revalidatePath("/practice");
  revalidatePath(`/practice/${subjectId}`);
}
