import "server-only";

import type { CodeType, HubSetChoice, RedeemFailReason, RedeemResult } from "@/lib/codes";
import { normalizeCode } from "@/lib/codes";
import { check, db, requireUserId, rpc } from "./client";

/** A practice-set code the signed-in student made (RLS: their own codes only), as an "own" redeem result. */
async function ownSetCode(code: string): Promise<RedeemResult | null> {
  const c = normalizeCode(code);
  if (c.length < 5 || c.length > 12) return null;
  const uid = await requireUserId();
  const { data } = await (await db())
    .from("share_codes")
    .select("set_id, set:practice_sets(id, title, subject_id, owner_id)")
    .eq("code", c)
    .eq("created_by", uid)
    .eq("type", "practice_set")
    .maybeSingle();
  const set = (data as { set: { id: string; title: string; subject_id: string; owner_id: string } | null } | null)?.set;
  if (!set || set.owner_id !== uid) return null;
  return { ok: true, type: "practice_set", setId: set.id, title: set.title, subjectId: set.subject_id, own: true };
}

/* eslint-disable @typescript-eslint/no-explicit-any -- RPC JSON is untyped; typed here */

export type MyCode = {
  code: string;
  type: CodeType;
  useCount: number;
  maxUses: number | null;
  expiresAt: string | null;
  createdAt: string;
  /** What it shares: the set or Hub item's title (null once it's gone). */
  title: string | null;
  /** Admin-only label on Pro codes ("Beta wave 1"). */
  note: string | null;
  /** Hub sets: how many items the snapshot holds. */
  itemCount: number | null;
  setId: string | null;
  hubItemId: string | null;
};

/** create_share_code: the owner's code for a set or Hub item (made once, then the same one). */
export async function createShareCode(type: "practice_set" | "hub_item", targetId: string): Promise<{ code: string; useCount: number }> {
  const r = await rpc<{ code: string; use_count: number }>("create_share_code", { p_type: type, p_target: targetId });
  return { code: r.code, useCount: r.use_count };
}

/** create_hub_set_code: a new code for a copy of these Hub items (1–100, the caller's own). */
export async function createHubSetCode(name: string, itemIds: string[]): Promise<{ code: string; useCount: number; count: number; name: string }> {
  const r = await rpc<{ code: string; use_count: number; count: number; name: string }>("create_hub_set_code", { p_name: name, p_item_ids: itemIds });
  return { code: r.code, useCount: r.use_count, count: r.count, name: r.name };
}

/**
 * redeem_code: the one way any code is used (locks, checks, applies, records; rate-limited).
 * A Hub set code without `choice` comes back as needs_choice with a preview; nothing is used.
 */
export async function redeemCode(code: string, choice?: HubSetChoice): Promise<RedeemResult> {
  // Their own set's code (the one on its printed PDF): open that set to mark it.
  // Checked first, so it never counts as a failed try.
  const own = await ownSetCode(code);
  if (own) return own;
  const r = await rpc<any>("redeem_code", { p_code: code, p_options: choice ?? null });
  if (r?.reason === "needs_choice") {
    const p = r.preview ?? {};
    return { ok: false, reason: "needs_choice", preview: { name: p.name, count: p.count, firstStart: p.first_start, lastEnd: p.last_end } };
  }
  if (!r?.ok) return { ok: false, reason: (r?.reason ?? "not_found") as RedeemFailReason };
  switch (r.type) {
    case "hub_set":
      return { ok: true, type: "hub_set", name: r.name, count: r.count, firstStart: r.first_start, shiftDays: r.shift_days };
    case "practice_set":
      return { ok: true, type: "practice_set", setId: r.set_id, title: r.title, subjectId: r.subject_id };
    case "hub_item":
      return { ok: true, type: "hub_item", hubItemId: r.hub_item_id, title: r.title, startAt: r.start_at };
    default:
      return {
        ok: true,
        type: "pro_trial",
        days: r.days,
        startsAt: r.starts_at,
        expiresAt: r.expires_at,
        extended: Date.parse(r.starts_at) > Date.now() + 60_000,
      };
  }
}

/** Codes the signed-in student made (RLS: their own only), newest first. */
export async function getMyCodes(): Promise<MyCode[]> {
  const uid = await requireUserId();
  const { data, error } = await (await db())
    .from("share_codes")
    .select("code, type, use_count, max_uses, expires_at, created_at, note, set_id, hub_item_id, set:practice_sets(title), item:hub_items(title), set_name:payload->>name, set_count:payload->>count")
    .eq("created_by", uid)
    .order("created_at", { ascending: false })
    .limit(200);
  check(error);
  return (data ?? []).map((r: any) => ({
    code: r.code,
    type: r.type,
    useCount: r.use_count,
    maxUses: r.max_uses,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
    title: r.set?.title ?? r.item?.title ?? r.set_name ?? null,
    note: r.note,
    itemCount: r.set_count != null ? Number(r.set_count) : null,
    setId: r.set_id,
    hubItemId: r.hub_item_id,
  }));
}

/** The existing code for one set or Hub item, if it has been shared (no new code is made). */
export async function getShareCodeFor(type: "practice_set" | "hub_item", targetId: string): Promise<{ code: string; useCount: number } | null> {
  const { data, error } = await (await db())
    .from("share_codes")
    .select("code, use_count")
    .eq(type === "practice_set" ? "set_id" : "hub_item_id", targetId)
    .maybeSingle();
  check(error);
  return data ? { code: data.code, useCount: data.use_count } : null;
}

export type SharingStats = {
  /** Times your set and Hub codes were used. */
  uses: number;
  /** Different students (set up accounts) who redeemed them. */
  friends: number;
  goal: number;
  rewardDays: number;
  claimedAt: string | null;
  canClaim: boolean;
};

/**
 * my_sharing_stats (migration 33). Null if it can't be read (for example
 * before migration 33 has run), so /codes still works without it.
 */
export async function getSharingStats(): Promise<SharingStats | null> {
  const { data, error } = await (await db()).rpc("my_sharing_stats");
  if (error || !data) return null;
  const r = data as any;
  return { uses: r.uses, friends: r.friends, goal: r.goal, rewardDays: r.reward_days, claimedAt: r.claimed_at, canClaim: !!r.can_claim };
}

/** claim_share_reward: the week of Pro for sharing with 3 students (once per account). */
export async function claimShareReward(): Promise<{ ok: true; expiresAt: string } | { ok: false; reason: "already_claimed" | "not_yet" | "already_unlimited" }> {
  const r = await rpc<any>("claim_share_reward");
  return r?.ok ? { ok: true, expiresAt: r.expires_at } : { ok: false, reason: r?.reason ?? "not_yet" };
}

/** public_share_uses: how often someone's set and Hub codes were used (shown on profiles). Null if unavailable. */
export async function getPublicShareUses(userId: string): Promise<number | null> {
  const { data, error } = await (await db()).rpc("public_share_uses", { p_user: userId });
  return error || typeof data !== "number" ? null : data;
}
