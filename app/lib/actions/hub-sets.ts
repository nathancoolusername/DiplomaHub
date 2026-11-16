"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { getCurrentUserId } from "../get-current-user";
import { createHubSetCode } from "@/lib/data";
import type { ActionResult } from "../types";

// Hub sets (migration 46): named groups of Hub items a student keeps. Made by
// hand (pick items), from a calendar import, by Bro, or by redeeming a code;
// shared as a Hub set code. Everything runs as the student: RLS keeps sets
// and items their own, and the guard trigger stops an item joining someone
// else's set.

export type HubSetSummary = {
  id: string;
  name: string;
  source: "student" | "bro" | "code" | "import";
  itemCount: number;
  firstStart: string | null;
  lastEnd: string | null;
};

async function ctx() {
  const [supabase, uid] = await Promise.all([createClient(), getCurrentUserId()]);
  return { supabase, uid };
}

const cleanName = (n: unknown) => (typeof n === "string" ? n.replace(/\s+/g, " ").trim().slice(0, 80) : "");

export async function listHubSets(): Promise<ActionResult<HubSetSummary[]>> {
  const { supabase, uid } = await ctx();
  if (!uid) return { success: false, error: "Sign in first." };
  const [sets, items] = await Promise.all([
    supabase.from("hub_sets").select("id, name, source").eq("owner_id", uid).order("created_at", { ascending: false }),
    supabase.from("hub_items").select("hub_set_id, start_at, end_at").eq("owner_id", uid).not("hub_set_id", "is", null),
  ]);
  if (sets.error) return { success: false, error: sets.error.message };
  if (items.error) return { success: false, error: items.error.message };
  return {
    success: true,
    data: (sets.data ?? []).map((s) => {
      const its = (items.data ?? []).filter((i) => i.hub_set_id === s.id);
      const starts = its.map((i) => i.start_at as string).sort();
      const ends = its.map((i) => i.end_at as string).sort();
      return {
        id: s.id as string,
        name: s.name as string,
        source: s.source as HubSetSummary["source"],
        itemCount: its.length,
        firstStart: starts[0] ?? null,
        lastEnd: ends[ends.length - 1] ?? null,
      };
    }),
  };
}

/** Makes a set from some of the student's Hub items (they move out of any set they were in). */
export async function createHubSet(name: unknown, itemIds: unknown, source: "student" | "bro" | "import" = "student"): Promise<ActionResult<{ id: string; name: string }>> {
  const { supabase, uid } = await ctx();
  if (!uid) return { success: false, error: "Sign in first." };
  const n = cleanName(name);
  if (!n) return { success: false, error: "Give the set a name." };
  const ids = Array.isArray(itemIds) ? [...new Set(itemIds.filter((x): x is string => typeof x === "string" && x.length <= 100))] : [];
  if (ids.length === 0) return { success: false, error: "Pick at least one item." };
  if (ids.length > 100) return { success: false, error: "A set can have at most 100 items." };
  const { data: set, error } = await supabase.from("hub_sets").insert({ owner_id: uid, name: n, source }).select("id, name").single();
  if (error || !set) return { success: false, error: "Couldn't make the set. Try again?" };
  const { error: e2 } = await supabase.from("hub_items").update({ hub_set_id: set.id }).eq("owner_id", uid).in("id", ids);
  if (e2) {
    await supabase.from("hub_sets").delete().eq("id", set.id);
    return { success: false, error: "Couldn't add the items to the set." };
  }
  revalidatePath("/hub");
  return { success: true, data: { id: set.id as string, name: set.name as string } };
}

/** "Make these a set?" after a calendar import: the batch's items that aren't in a set yet. */
export async function createHubSetFromImport(name: unknown, batchId: unknown): Promise<ActionResult<{ id: string; name: string; count: number }>> {
  const { supabase, uid } = await ctx();
  if (!uid) return { success: false, error: "Sign in first." };
  if (typeof batchId !== "string" || !batchId) return { success: false, error: "Bad request." };
  const { data, error } = await supabase.from("hub_items").select("id").eq("owner_id", uid).eq("import_batch_id", batchId).is("hub_set_id", null);
  if (error) return { success: false, error: error.message };
  const ids = (data ?? []).map((r) => r.id as string);
  if (ids.length === 0) return { success: false, error: "These items are already in a set." };
  const res = await createHubSet(name, ids, "import");
  return res.success ? { success: true, data: { ...res.data, count: ids.length } } : res;
}

/** Deletes a set; its items stay in the Hub. */
export async function deleteHubSet(id: string): Promise<ActionResult<null>> {
  const { supabase, uid } = await ctx();
  if (!uid) return { success: false, error: "Sign in first." };
  const { error } = await supabase.from("hub_sets").delete().eq("id", id).eq("owner_id", uid);
  if (error) return { success: false, error: error.message };
  revalidatePath("/hub");
  return { success: true, data: null };
}

export async function renameHubSet(id: string, name: unknown): Promise<ActionResult<null>> {
  const { supabase, uid } = await ctx();
  if (!uid) return { success: false, error: "Sign in first." };
  const n = cleanName(name);
  if (!n) return { success: false, error: "Give the set a name." };
  const { error } = await supabase.from("hub_sets").update({ name: n, updated_at: new Date().toISOString() }).eq("id", id).eq("owner_id", uid);
  if (error) return { success: false, error: error.message };
  revalidatePath("/hub");
  return { success: true, data: null };
}

/** A share code for the set as it is now (a snapshot of its items, migration 32). */
export async function shareHubSet(id: string): Promise<ActionResult<{ code: string; name: string; count: number }>> {
  const { supabase, uid } = await ctx();
  if (!uid) return { success: false, error: "Sign in first." };
  const [{ data: set }, { data: items }] = await Promise.all([
    supabase.from("hub_sets").select("name").eq("id", id).eq("owner_id", uid).maybeSingle(),
    supabase.from("hub_items").select("id").eq("owner_id", uid).eq("hub_set_id", id),
  ]);
  if (!set) return { success: false, error: "That set is gone." };
  const ids = (items ?? []).map((i) => i.id as string);
  if (ids.length === 0) return { success: false, error: "This set has no items left." };
  try {
    const r = await createHubSetCode(set.name as string, ids);
    revalidatePath("/codes");
    return { success: true, data: { code: r.code, name: r.name, count: r.count } };
  } catch {
    return { success: false, error: "Couldn't make a code. Try again?" };
  }
}
