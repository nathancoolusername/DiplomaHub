import "server-only";

import { createAdminClient } from "@/app/lib/supabase/admin";
import { checkMemory, type MemoryKind } from "@/lib/bro/memory-rules";
import { check, db, requireUserId } from "./client";

// DiplomaBro memory ─ bro_memory (migration 39). Students read and delete
// their own items through RLS. Saving and editing go through here with the
// service role, after checkMemory() refuses sensitive details; the database
// caps it at 30 items per student.

export type BroMemoryItem = { id: number; kind: MemoryKind; content: string; source: "bro" | "student"; updatedAt: string };

export type MemoryWrite = { ok: true; item: BroMemoryItem } | { ok: false; reason: string };

const COLUMNS = "id, kind, content, source, updated_at";

type Row = { id: number; kind: MemoryKind; content: string; source: "bro" | "student"; updated_at: string };
const toItem = (r: Row): BroMemoryItem => ({ id: r.id, kind: r.kind, content: r.content, source: r.source, updatedAt: r.updated_at });

/** Everything Bro remembers about the signed-in student, oldest first. */
export async function getBroMemory(): Promise<BroMemoryItem[]> {
  const uid = await requireUserId();
  const { data, error } = await (await db()).from("bro_memory").select(COLUMNS).eq("user_id", uid).order("created_at").order("id");
  check(error);
  return ((data ?? []) as Row[]).map(toItem);
}

function friendly(message: string): string {
  return message.includes("30 things") ? "Bro already remembers 30 things. Delete some first." : "Couldn't save that. Try again?";
}

/** Saves one item for this student (Bro's remember tool, or the student on the memory page). */
export async function addBroMemory(userId: string, kind: unknown, content: unknown, source: "bro" | "student"): Promise<MemoryWrite> {
  const c = checkMemory(kind, content);
  if (!c.ok) return c;
  const { data, error } = await createAdminClient()
    .from("bro_memory")
    .insert({ user_id: userId, kind, content: c.content, source })
    .select(COLUMNS)
    .single();
  if (error) return { ok: false, reason: friendly(error.message) };
  return { ok: true, item: toItem(data as Row) };
}

/** The student edits one of their items. */
export async function updateBroMemory(id: number, kind: unknown, content: unknown): Promise<MemoryWrite> {
  const uid = await requireUserId();
  const c = checkMemory(kind, content);
  if (!c.ok) return c;
  const { data, error } = await createAdminClient()
    .from("bro_memory")
    .update({ kind, content: c.content, source: "student", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", uid)
    .select(COLUMNS)
    .maybeSingle();
  if (error) return { ok: false, reason: friendly(error.message) };
  if (!data) return { ok: false, reason: "That item is gone." };
  return { ok: true, item: toItem(data as Row) };
}

/** Deletes one item of the signed-in student (RLS: only their own). Returns what was deleted. */
export async function deleteBroMemory(id: number): Promise<string | null> {
  const uid = await requireUserId();
  const { data, error } = await (await db()).from("bro_memory").delete().eq("id", id).eq("user_id", uid).select("content").maybeSingle();
  check(error);
  return (data?.content as string | undefined) ?? null;
}

/** Bro's forget tool: deletes one item for this student (server side, after the chat route's checks). */
export async function forgetBroMemory(userId: string, id: number): Promise<string | null> {
  const { data, error } = await createAdminClient().from("bro_memory").delete().eq("id", id).eq("user_id", userId).select("content").maybeSingle();
  check(error);
  return (data?.content as string | undefined) ?? null;
}

/** Delete everything. */
export async function clearBroMemory(): Promise<void> {
  const uid = await requireUserId();
  const { error } = await (await db()).from("bro_memory").delete().eq("user_id", uid);
  check(error);
}
