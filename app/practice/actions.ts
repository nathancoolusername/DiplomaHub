"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AnswerDraft, AttemptAnswer, BuildSettings, Level, Markscheme, PracticeType, SetPreview, SubjectId } from "@/lib/data/types";
import {
  addExtraClass,
  buildSet,
  getUsage,
  getUserSubject,
  previewSet,
  redeemShareCode,
  confirmMarks,
  createRedoSet,
  finishAttempt,
  discardAttempt,
  completeScheduledSet,
  scheduleSet,
  getViewer,
  removeExtraClass,
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

/** Written questions a free student can still start this week (null = no limit). */
async function writtenRemaining(): Promise<number | null> {
  const viewer = await getViewer();
  if (viewer.isPro) return null;
  const item = (await getUsage()).find((u) => u.feature === "written_questions");
  return item && item.limit !== null ? Math.max(0, item.limit - item.used) : null;
}

/**
 * Go: builds the set and opens the player. Free students over their weekly
 * written-question limit must pass `cutToRemaining` (the "cut the set" choice).
 */
export async function goAction(
  subjectId: SubjectId,
  practiceType: PracticeType,
  settings: BuildSettings,
  cutToRemaining = false,
  name: string | null = null,
): Promise<never> {
  const level = await subjectLevel(subjectId);
  const remaining = await writtenRemaining();
  if (remaining !== null && !cutToRemaining) {
    const preview = await previewSet(subjectId, practiceType, level, settings);
    if (preview.writtenInSet > remaining) throw new Error("Over the free written-question limit");
  }
  // TODO(billing): consume_quota("written_questions") per written question, atomically.
  const set = await applyName(await buildSet(subjectId, practiceType, level, settings, { writtenCap: remaining, save: false }), name);
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
  const viewer = await getViewer();
  if (!viewer.isPro) throw new Error("Scheduling is part of DiplomaPro");
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
