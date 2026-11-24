"use server";

import { revalidatePath } from "next/cache";
import { getProStatus } from "@/lib/data";
import {
  createDraftUpload,
  createReviewProject,
  deleteReviewDraft,
  deleteReviewProject,
  getDraftFileUrl,
  setPrioritiesDone,
  updateReviewProject,
  setReviewProjectLevel,
  ReviewsNotReadyError,
} from "@/lib/data/supabase/reviews";
import { criteriaFor } from "@/lib/review/criteria";
import type { ReviewKind, ReviewLevel } from "@/lib/review/labels";

export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };

const KINDS: ReviewKind[] = ["ia", "ee", "tok_essay", "tok_exhibition"];
const MAX_BYTES = 25 * 1024 * 1024;

async function guard<T>(fn: () => Promise<T>, pro = true): Promise<ActionResult<T>> {
  try {
    if (pro && !(await getProStatus()).isPro) return { ok: false, error: "Coursework reviews are part of DiplomaPro." };
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ReviewsNotReadyError) return { ok: false, error: "Coursework review isn't switched on yet (the database update hasn't run)." };
    console.error("review action failed", e);
    return { ok: false, error: "Something went wrong. Try again in a moment." };
  }
}

export async function createProjectAction(input: { kind: string; subjectId: string | null; level: string | null; title: string; question: string }): Promise<ActionResult<string>> {
  const kind = input.kind as ReviewKind;
  if (!KINDS.includes(kind)) return { ok: false, error: "Pick what you're writing." };
  const subjectId = kind === "ia" || kind === "ee" ? input.subjectId : null;
  if ((kind === "ia" || kind === "ee") && !subjectId) return { ok: false, error: "Pick the subject." };
  if (kind === "ia" && !criteriaFor(kind, subjectId)) return { ok: false, error: "That subject's IA isn't supported yet." };
  const title = input.title.trim().slice(0, 120);
  if (!title) return { ok: false, error: "Give it a name." };
  return guard(() => createReviewProject({ kind, subjectId, level: kind === "ia" && (input.level === "SL" || input.level === "HL") ? (input.level as ReviewLevel) : null, title, question: input.question.trim().slice(0, 400) }));
}

export async function updateProjectAction(id: string, title: string, question: string): Promise<ActionResult> {
  const t = title.trim().slice(0, 120);
  if (!t) return { ok: false, error: "Give it a name." };
  const r = await guard(() => updateReviewProject(id, { title: t, question: question.trim().slice(0, 400) }));
  revalidatePath(`/review/${id}`);
  return r.ok ? { ok: true, data: null } : r;
}

export async function setLevelAction(id: string, level: string): Promise<ActionResult> {
  if (level !== "SL" && level !== "HL") return { ok: false, error: "Pick SL or HL." };
  const r = await guard(() => setReviewProjectLevel(id, level));
  revalidatePath(`/review/${id}`);
  return r.ok ? { ok: true, data: null } : r;
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  // Deleting your own work never needs Pro.
  const r = await guard(() => deleteReviewProject(id), false);
  revalidatePath("/review");
  return r.ok ? { ok: true, data: null } : r;
}

export async function startUploadAction(projectId: string, fileName: string, bytes: number): Promise<ActionResult<{ draftId: string; path: string; token: string }>> {
  if (!/\.pdf$/i.test(fileName)) return { ok: false, error: "Upload a PDF (in Word or Google Docs: File → Save as / Download → PDF)." };
  if (bytes <= 0 || bytes > MAX_BYTES) return { ok: false, error: "The PDF must be under 25 MB." };
  return guard(() => createDraftUpload(projectId, fileName, bytes));
}

export async function deleteDraftAction(projectId: string, draftId: string): Promise<ActionResult> {
  const r = await guard(() => deleteReviewDraft(draftId), false);
  revalidatePath(`/review/${projectId}`);
  return r.ok ? { ok: true, data: null } : r;
}

export async function setPrioritiesDoneAction(draftId: string, done: number[]): Promise<ActionResult> {
  const r = await guard(() => setPrioritiesDone(draftId, done), false);
  return r.ok ? { ok: true, data: null } : r;
}

export async function draftFileUrlAction(draftId: string): Promise<ActionResult<string | null>> {
  return guard(() => getDraftFileUrl(draftId), false);
}
