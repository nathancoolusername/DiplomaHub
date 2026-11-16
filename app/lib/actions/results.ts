"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "../get-current-user";
import { addResult, deleteResult, getUserSubjects, setBoundaryOverride, updateResult } from "@/lib/data";
import { checkBounds, type Bounds } from "@/lib/grade-boundaries";
import type { ResultInput, StudentResult } from "@/lib/results";
import type { ActionResult } from "../types";

// /progress: log, edit and delete your own results (student_results). Free
// for every signed-in student; checkResult() cleans the input, RLS keeps
// everyone to their own rows.

type Input = Partial<Record<keyof ResultInput, unknown>>;

export async function logResult(input: Input): Promise<ActionResult<StudentResult>> {
  if (!(await getCurrentUserId())) return { success: false, error: "Sign in first." };
  const r = await addResult(input);
  if (!r.ok) return { success: false, error: r.reason };
  revalidatePath("/progress");
  return { success: true, data: r.result };
}

export async function editResult(id: string, input: Input): Promise<ActionResult<StudentResult>> {
  if (!(await getCurrentUserId())) return { success: false, error: "Sign in first." };
  const r = await updateResult(id, input);
  if (!r.ok) return { success: false, error: r.reason };
  revalidatePath("/progress");
  return { success: true, data: r.result };
}

export async function removeResult(id: string): Promise<ActionResult<null>> {
  if (!(await getCurrentUserId())) return { success: false, error: "Sign in first." };
  await deleteResult(id);
  revalidatePath("/progress");
  return { success: true, data: null };
}

/** Saves a subject's grade boundaries to match the student's school; null resets to the IB's. */
export async function saveBoundaries(subjectId: string, bounds: unknown[] | null): Promise<ActionResult<Bounds | null>> {
  if (!(await getCurrentUserId())) return { success: false, error: "Sign in first." };
  if (!(await getUserSubjects()).some((s) => s.subject.id === subjectId)) return { success: false, error: "That isn't one of your subjects." };
  if (bounds === null) {
    await setBoundaryOverride(subjectId, null);
    revalidatePath("/progress");
    return { success: true, data: null };
  }
  const clean = checkBounds(bounds);
  if (!clean) return { success: false, error: "Use whole numbers from 1 to 100, each grade higher than the one below." };
  await setBoundaryOverride(subjectId, clean);
  revalidatePath("/progress");
  return { success: true, data: clean };
}
