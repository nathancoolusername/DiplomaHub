"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { isAdmin } from "../admin";
import { createNotification } from "./notifications";
import type { ActionResult } from "../types";

// Admin → Pro: entitlements (migration 30). Everything goes through the
// service-role client after the admin check; the entitlements trigger then
// recalculates users.is_pro / pro_expires_at, so nothing here writes is_pro.

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.id)) return null;
  return { admin: createAdminClient(), user: user! };
}

export type EntitlementPlan = "beta" | "trial" | "monthly" | "one_year" | "two_year" | "unlimited";
export type EntitlementSource = "beta" | "code" | "points" | "lemon_squeezy" | "admin" | "referral";
export type EntitlementStatus = "active" | "scheduled" | "ended";

export type AdminEntitlementRow = {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  plan: EntitlementPlan;
  source: EntitlementSource;
  startsAt: string;
  /** null = never ends (unlimited). */
  expiresAt: string | null;
  note: string | null;
  lsOrderId: string | null;
  createdAt: string;
  status: EntitlementStatus;
};

export type ProAdminStats = {
  activeUsers: number;
  expiringIn7Days: number;
  scheduled: number;
  byPlan: { plan: EntitlementPlan; count: number }[];
};

export type ProUserHit = { id: string; displayName: string; email: string; isPro: boolean; expiresAt: string | null };

const PLANS: EntitlementPlan[] = ["unlimited", "beta", "trial", "monthly", "one_year", "two_year"];
const DAY_MS = 86_400_000;

function ms(v: string): number {
  return v === "infinity" ? Infinity : Date.parse(v);
}

function statusOf(startsAt: string, expiresAt: string, now: number): EntitlementStatus {
  if (ms(startsAt) > now) return "scheduled";
  return ms(expiresAt) > now ? "active" : "ended";
}

type Joined = {
  id: string;
  user_id: string;
  plan: EntitlementPlan;
  source: EntitlementSource;
  starts_at: string;
  expires_at: string;
  note: string | null;
  ls_order_id: string | null;
  created_at: string;
  user: { display_name: string | null; email: string | null } | null;
};

function toRow(r: Joined, now: number): AdminEntitlementRow {
  return {
    id: r.id,
    userId: r.user_id,
    displayName: r.user?.display_name || "Student",
    email: r.user?.email ?? "",
    plan: r.plan,
    source: r.source,
    startsAt: r.starts_at,
    expiresAt: r.expires_at === "infinity" ? null : r.expires_at,
    note: r.note,
    lsOrderId: r.ls_order_id,
    createdAt: r.created_at,
    status: statusOf(r.starts_at, r.expires_at, now),
  };
}

/** The Pro page: totals, plus the newest entitlements (optionally one user's). */
export async function getProAdminData(userId?: string): Promise<ActionResult<{ stats: ProAdminStats; rows: AdminEntitlementRow[] }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  let list = ctx.admin
    .from("entitlements")
    .select("id, user_id, plan, source, starts_at, expires_at, note, ls_order_id, created_at, user:users!entitlements_user_id_fkey(display_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (userId) list = list.eq("user_id", userId);

  const [rowsRes, liveRes, scheduledRes] = await Promise.all([
    list,
    // Every entitlement running now, to count people and plans.
    ctx.admin.from("entitlements").select("user_id, plan, expires_at").lte("starts_at", nowIso).gt("expires_at", nowIso),
    ctx.admin.from("entitlements").select("id", { count: "exact", head: true }).gt("starts_at", nowIso),
  ]);
  if (rowsRes.error) return { success: false, error: rowsRes.error.message };
  if (liveRes.error) return { success: false, error: liveRes.error.message };
  if (scheduledRes.error) return { success: false, error: scheduledRes.error.message };

  // One plan per person: the entitlement that runs longest.
  const best = new Map<string, { plan: EntitlementPlan; expires: number }>();
  for (const e of liveRes.data ?? []) {
    const exp = ms(e.expires_at);
    const cur = best.get(e.user_id);
    if (!cur || exp > cur.expires) best.set(e.user_id, { plan: e.plan as EntitlementPlan, expires: exp });
  }
  const people = [...best.values()];
  const stats: ProAdminStats = {
    activeUsers: people.length,
    expiringIn7Days: people.filter((p) => p.expires !== Infinity && p.expires - now < 7 * DAY_MS).length,
    scheduled: scheduledRes.count ?? 0,
    byPlan: PLANS.map((plan) => ({ plan, count: people.filter((p) => p.plan === plan).length })).filter((p) => p.count > 0),
  };

  return { success: true, data: { stats, rows: ((rowsRes.data ?? []) as unknown as Joined[]).map((r) => toRow(r, now)) } };
}

/** Finds accounts by name or email to give Pro to. */
export async function searchUsersForPro(query: string): Promise<ActionResult<ProUserHit[]>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };
  const q = query.trim().replace(/[%,()]/g, "");
  if (q.length < 2) return { success: true, data: [] };
  const { data, error } = await ctx.admin
    .from("dp_members") // not guests
    .select("id, display_name, email, is_pro, pro_expires_at")
    .or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) return { success: false, error: error.message };
  const now = Date.now();
  return {
    success: true,
    data: (data ?? []).map((u) => ({
      id: u.id,
      displayName: u.display_name || "Student",
      email: u.email ?? "",
      isPro: !!u.is_pro && !!u.pro_expires_at && ms(u.pro_expires_at) > now,
      expiresAt: u.pro_expires_at === "infinity" ? null : u.pro_expires_at,
    })),
  };
}

/** Gives a student beta Pro for `days` days, starting now. */
export async function grantBetaEntitlement(userId: string, days: number, note?: string): Promise<ActionResult<null>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };
  if (!Number.isInteger(days) || days < 1 || days > 730) return { success: false, error: "Days must be a whole number from 1 to 730" };
  if (isAdmin(userId)) return { success: false, error: "The admin account already has unlimited Pro" };
  const cleanNote = note?.trim().slice(0, 200) || null;

  const now = Date.now();
  const { error } = await ctx.admin.from("entitlements").insert({
    user_id: userId,
    plan: "beta",
    source: "beta",
    starts_at: new Date(now).toISOString(),
    expires_at: new Date(now + days * DAY_MS).toISOString(),
    granted_by: ctx.user.id,
    note: cleanNote,
  });
  if (error) return { success: false, error: error.message };

  await createNotification({
    userId,
    actorId: ctx.user.id,
    type: "admin_pro_upgrade",
    message: `You've got DiplomaPro beta for ${days} day${days === 1 ? "" : "s"}!`,
    link: "/practice",
  });

  revalidatePath("/admin/pro");
  revalidatePath("/admin/users");
  return { success: true, data: null };
}

/** Ends one entitlement now (a scheduled one ends before it starts). */
export async function endEntitlement(id: string): Promise<ActionResult<null>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };
  const { data: row, error } = await ctx.admin.from("entitlements").select("plan, starts_at, expires_at").eq("id", id).single();
  if (error) return { success: false, error: error.message };
  if (row.plan === "unlimited") return { success: false, error: "The admin's unlimited Pro can't be ended here" };
  const now = Date.now();
  if (ms(row.expires_at) <= now) return { success: true, data: null };

  const end = new Date(Math.max(now, ms(row.starts_at))).toISOString();
  const { error: e2 } = await ctx.admin.from("entitlements").update({ expires_at: end }).eq("id", id);
  if (e2) return { success: false, error: e2.message };
  revalidatePath("/admin/pro");
  revalidatePath("/admin/users");
  return { success: true, data: null };
}

/** Ends every running or scheduled entitlement of one student. */
export async function endAllProForUser(userId: string): Promise<ActionResult<{ ended: number }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };
  const nowIso = new Date().toISOString();
  const { data: rows, error } = await ctx.admin
    .from("entitlements")
    .select("id")
    .eq("user_id", userId)
    .neq("plan", "unlimited")
    .gt("expires_at", nowIso);
  if (error) return { success: false, error: error.message };
  for (const r of rows ?? []) {
    const res = await endEntitlement(r.id);
    if (!res.success) return res;
  }
  return { success: true, data: { ended: rows?.length ?? 0 } };
}

/** Runs the hourly refresh now (the same function pg_cron calls). */
export async function refreshProNow(): Promise<ActionResult<{ updated: number }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };
  const { data, error } = await ctx.admin.rpc("dp_refresh_pro");
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/pro");
  return { success: true, data: { updated: (data as number) ?? 0 } };
}

/**
 * Makes a batch of DiplomaPro trial codes (beta invites, the contest prize).
 * Admin only: checked here, and again inside dp_create_pro_trial_codes(),
 * which only the service role can call and which refuses any creator other
 * than the admin account. Codes are 10 characters (31^10 possibilities).
 */
export async function createProTrialCodes(input: {
  count: number;
  days: number;
  /** Uses per code; null = unlimited (one shared code for a whole group). */
  maxUses: number | null;
  /** The codes stop working after this many days; null = never. */
  expiresInDays: number | null;
  note?: string;
  plan?: "trial" | "beta";
}): Promise<ActionResult<{ codes: string[] }>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };
  const { count, days, maxUses, expiresInDays } = input;
  if (!Number.isInteger(count) || count < 1 || count > 500) return { success: false, error: "Make between 1 and 500 codes at a time" };
  if (!Number.isInteger(days) || days < 1 || days > 730) return { success: false, error: "Days must be a whole number from 1 to 730" };
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) return { success: false, error: "Uses must be at least 1 (or unlimited)" };
  if (expiresInDays !== null && (!Number.isInteger(expiresInDays) || expiresInDays < 1 || expiresInDays > 3650))
    return { success: false, error: "Expiry must be 1 to 3650 days away (or never)" };

  const { data, error } = await ctx.admin.rpc("dp_create_pro_trial_codes", {
    p_created_by: ctx.user.id,
    p_count: count,
    p_days: days,
    p_max_uses: maxUses,
    p_expires_at: expiresInDays === null ? null : new Date(Date.now() + expiresInDays * DAY_MS).toISOString(),
    p_note: input.note?.trim().slice(0, 200) || null,
    p_plan: input.plan ?? "trial",
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/codes");
  return { success: true, data: { codes: (data as string[]) ?? [] } };
}

export type AdminProCode = {
  id: string;
  code: string;
  days: number;
  plan: string;
  note: string | null;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
  createdAt: string;
  /** False once used up or past its expiry. */
  live: boolean;
  redeemedBy: { userId: string; name: string; at: string }[];
};

/** Pro trial codes (migration 32), newest first, with who redeemed each one. */
export async function getProCodes(): Promise<ActionResult<AdminProCode[]>> {
  const ctx = await requireAdmin();
  if (!ctx) return { success: false, error: "Not authorized" };
  const { data, error } = await ctx.admin
    .from("share_codes")
    .select("id, code, payload, note, use_count, max_uses, expires_at, created_at, share_code_redemptions(user_id, redeemed_at, user:users!share_code_redemptions_user_id_fkey(display_name))")
    .eq("type", "pro_trial")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return { success: false, error: error.message };
  type Row = {
    id: string;
    code: string;
    payload: { days?: number; plan?: string } | null;
    note: string | null;
    use_count: number;
    max_uses: number | null;
    expires_at: string | null;
    created_at: string;
    share_code_redemptions: { user_id: string; redeemed_at: string; user: { display_name: string | null } | null }[];
  };
  const now = Date.now();
  return {
    success: true,
    data: ((data ?? []) as unknown as Row[]).map((r) => ({
      live: (r.max_uses === null || r.use_count < r.max_uses) && (r.expires_at === null || Date.parse(r.expires_at) > now),
      id: r.id,
      code: r.code,
      days: r.payload?.days ?? 0,
      plan: r.payload?.plan ?? "trial",
      note: r.note,
      uses: r.use_count,
      maxUses: r.max_uses,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
      redeemedBy: (r.share_code_redemptions ?? []).map((x) => ({ userId: x.user_id, name: x.user?.display_name || "Student", at: x.redeemed_at })),
    })),
  };
}
