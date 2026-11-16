"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { isAdmin } from "../admin";
import { DAILY_CAPS, type UsageMetric } from "@/lib/plans";
import type { TokenTotals } from "@/lib/bro/pricing";
import type { ActionResult } from "../types";

// Admin → Bro: what DiplomaBro is doing and costing, and the "This is wrong"
// flags to review (migrations 37–38). Service-role client after the admin
// check, like Admin → Pro. Only flagged replies are shown in full: the rest
// of the students' chats stay private, and only counts are shown.

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.id)) return null;
  return { admin: createAdminClient(), user: user! };
}

export type BroStats = {
  replies_today: number;
  replies_window: number;
  replies_total: number;
  users_today: number;
  users_7d: number;
  users_window: number;
  pro_now: number;
  flags_open: number;
  flags_window: number;
  tokens: { today: TokenTotals[]; month: TokenTotals[]; window: TokenTotals[] };
  series: { date: string; replies: number; users: number }[];
  top_users: { user_id: string; name: string; email: string | null; replies: number; days: number; last_at: string }[];
};

export type BroFlagStatus = "open" | "fixed" | "not_a_problem";

export type AdminBroFlag = {
  id: number;
  userId: string;
  name: string;
  email: string;
  reason: "wrong" | "ib_fact" | "unhelpful" | "other";
  note: string | null;
  question: string | null;
  answer: string;
  status: BroFlagStatus;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type CapHit = { userId: string; name: string; metric: UsageMetric; day: string; count: number; cap: number };

/** Counts only: what Bro remembers stays private to each student. */
export type MemoryCounts = { students: number; items: number };

export type BroAdminData = { stats: BroStats; flags: AdminBroFlag[]; capHits: CapHit[]; memory: MemoryCounts };

type FlagRow = {
  id: number;
  user_id: string;
  reason: AdminBroFlag["reason"];
  note: string | null;
  question: string | null;
  answer: string;
  status: BroFlagStatus;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  user: { display_name: string | null; email: string | null } | null;
};

export async function getBroAdminData(days: number, showReviewed: boolean): Promise<ActionResult<BroAdminData>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };

  const from = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  let flagQuery = ctx.admin
    .from("bro_flags")
    .select("id, user_id, reason, note, question, answer, status, admin_note, created_at, reviewed_at, user:users!bro_flags_user_id_fkey(display_name, email)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!showReviewed) flagQuery = flagQuery.eq("status", "open");

  const [statsRes, flagsRes, usageRes, memoryRes] = await Promise.all([
    ctx.admin.rpc("dp_admin_bro", { p_days: days }),
    flagQuery,
    ctx.admin
      .from("usage_counters")
      .select("user_id, metric, day, count, user:users!usage_counters_user_id_fkey(display_name)")
      .gte("day", from)
      .order("day", { ascending: false })
      .limit(1000),
    ctx.admin.from("bro_memory").select("user_id").limit(100000),
  ]);
  if (statsRes.error) return { success: false, error: statsRes.error.message };
  if (flagsRes.error) return { success: false, error: flagsRes.error.message };
  if (usageRes.error) return { success: false, error: usageRes.error.message };
  if (memoryRes.error) return { success: false, error: memoryRes.error.message };
  const memoryRows = (memoryRes.data ?? []) as { user_id: string }[];
  const memory = { students: new Set(memoryRows.map((r) => r.user_id)).size, items: memoryRows.length };

  const flags = ((flagsRes.data ?? []) as unknown as FlagRow[]).map((f) => ({
    id: f.id,
    userId: f.user_id,
    name: f.user?.display_name || "Student",
    email: f.user?.email ?? "",
    reason: f.reason,
    note: f.note,
    question: f.question,
    answer: f.answer,
    status: f.status,
    adminNote: f.admin_note,
    createdAt: f.created_at,
    reviewedAt: f.reviewed_at,
  }));

  // A day at the Pro cap (only Pro students reach Bro, and free caps are lower anyway).
  const capHits: CapHit[] = [];
  for (const r of (usageRes.data ?? []) as unknown as { user_id: string; metric: UsageMetric; day: string; count: number; user: { display_name: string | null } | null }[]) {
    const cap = DAILY_CAPS[r.metric]?.pro;
    if (cap !== null && cap !== undefined && r.count >= cap) {
      capHits.push({ userId: r.user_id, name: r.user?.display_name || "Student", metric: r.metric, day: r.day, count: r.count, cap });
    }
  }

  return { success: true, data: { stats: statsRes.data as BroStats, flags, capHits, memory } };
}

/** Marks a flag reviewed (fixed / not a problem) or opens it again, with an optional note to self. */
export async function reviewBroFlag(id: number, status: BroFlagStatus, adminNote?: string): Promise<ActionResult<null>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };
  if (!Number.isSafeInteger(id) || !["open", "fixed", "not_a_problem"].includes(status)) return { success: false, error: "Bad request" };
  const { error } = await ctx.admin
    .from("bro_flags")
    .update({
      status,
      admin_note: adminNote?.trim().slice(0, 1000) || null,
      reviewed_at: status === "open" ? null : new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/bro");
  return { success: true, data: null };
}
