"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "../get-current-user";
import { clearBroMemory, deleteBroMemory, getBroMemory, updateBroMemory } from "@/lib/data";
import { addBroMemory } from "@/lib/data/supabase/bro-memory";
import type { ActionResult } from "../types";
import type { BroMemoryItem } from "@/lib/data";

// "What Bro remembers" and Undo in the Bro bar. Any signed-in student can see
// and delete their memory, Pro or not (GDPR); writes are checked by
// checkMemory() in the data layer.

/** The current list, for the memory panel to catch up after Bro saves or forgets something. */
export async function listMemory(): Promise<ActionResult<BroMemoryItem[]>> {
  if (!(await getCurrentUserId())) return { success: false, error: "Sign in first." };
  return { success: true, data: await getBroMemory() };
}

export async function addMemoryItem(kind: string, content: string): Promise<ActionResult<BroMemoryItem>> {
  const uid = await getCurrentUserId();
  if (!uid) return { success: false, error: "Sign in first." };
  const r = await addBroMemory(uid, kind, content, "student");
  if (!r.ok) return { success: false, error: r.reason };
  revalidatePath("/bro/memory");
  return { success: true, data: r.item };
}

export async function editMemoryItem(id: number, kind: string, content: string): Promise<ActionResult<BroMemoryItem>> {
  if (!(await getCurrentUserId())) return { success: false, error: "Sign in first." };
  if (!Number.isSafeInteger(id)) return { success: false, error: "Bad request." };
  const r = await updateBroMemory(id, kind, content);
  if (!r.ok) return { success: false, error: r.reason };
  revalidatePath("/bro/memory");
  return { success: true, data: r.item };
}

export async function deleteMemoryItem(id: number): Promise<ActionResult<null>> {
  if (!(await getCurrentUserId())) return { success: false, error: "Sign in first." };
  if (!Number.isSafeInteger(id)) return { success: false, error: "Bad request." };
  await deleteBroMemory(id);
  revalidatePath("/bro/memory");
  return { success: true, data: null };
}

export async function deleteAllMemory(): Promise<ActionResult<null>> {
  if (!(await getCurrentUserId())) return { success: false, error: "Sign in first." };
  await clearBroMemory();
  revalidatePath("/bro/memory");
  return { success: true, data: null };
}
