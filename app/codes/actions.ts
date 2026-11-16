"use server";

import { revalidatePath } from "next/cache";
import { claimShareReward, createHubSetCode, createShareCode, getViewer, redeemCode } from "@/lib/data";
import { HUB_SET_MAX_ITEMS, type HubSetChoice, type RedeemResult } from "@/lib/codes";

// Thin wrappers, like app/practice/actions.ts: getViewer() throws for
// signed-out callers; ownership, validation, locking and the rate limit all
// live in the database functions (migration 32).

/** "Share" on a set or Hub item: its code (made the first time, the same one after). */
export async function createShareCodeAction(
  type: "practice_set" | "hub_item",
  targetId: string,
): Promise<{ ok: true; code: string; useCount: number } | { ok: false; error: string }> {
  await getViewer();
  if (type !== "practice_set" && type !== "hub_item") return { ok: false, error: "That can't be shared" };
  try {
    const r = await createShareCode(type, targetId);
    revalidatePath("/codes");
    return { ok: true, ...r };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return { ok: false, error: /not found/i.test(msg) ? "You can only share your own sets and Hub items." : "Couldn't make a code. Try again." };
  }
}

/** "Share a set" on the Hub: a new code for a copy of these items. */
export async function createHubSetCodeAction(
  name: string,
  itemIds: string[],
): Promise<{ ok: true; code: string; useCount: number; count: number; name: string } | { ok: false; error: string }> {
  await getViewer();
  if (!Array.isArray(itemIds) || itemIds.length === 0) return { ok: false, error: "Pick at least one item." };
  if (itemIds.length > HUB_SET_MAX_ITEMS) return { ok: false, error: `A set can have at most ${HUB_SET_MAX_ITEMS} items.` };
  try {
    const r = await createHubSetCode(String(name ?? ""), itemIds.map(String));
    revalidatePath("/codes");
    return { ok: true, ...r };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/not found/i.test(msg)) return { ok: false, error: "Some of those items aren't saved to your account yet. Refresh and try again." };
    if (/name|at least|at most|today/i.test(msg)) return { ok: false, error: msg };
    return { ok: false, error: "Couldn't make a code. Try again." };
  }
}

/** The big box on /codes: any kind of code. A Hub set needs `choice` (keep the dates or start on a day). */
export async function redeemCodeAction(code: string, choice?: HubSetChoice): Promise<RedeemResult> {
  await getViewer();
  let r: RedeemResult;
  try {
    r = await redeemCode(code, choice ? { startOn: choice.startOn || null, timezone: String(choice.timezone ?? "UTC").slice(0, 64) } : undefined);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/start date/i.test(msg)) return { ok: false, reason: "bad_date", message: msg };
    throw e;
  }
  if (r.ok) {
    revalidatePath("/codes");
    if (r.type === "practice_set") revalidatePath("/practice", "layout");
    if (r.type === "hub_item" || r.type === "hub_set") {
      revalidatePath("/hub");
      revalidatePath("/");
    }
    if (r.type === "pro_trial") revalidatePath("/", "layout");
  }
  return r;
}

/** "Claim your week of Pro" on /codes (3 students redeemed your codes; once per account). */
export async function claimShareRewardAction(): Promise<{ ok: true; expiresAt: string } | { ok: false; error: string }> {
  await getViewer();
  try {
    const r = await claimShareReward();
    if (r.ok) {
      revalidatePath("/", "layout");
      return r;
    }
    const error = {
      already_claimed: "You've already claimed your week of Pro.",
      not_yet: "Not yet: 3 different students need to redeem your codes first.",
      already_unlimited: "You already have unlimited Pro.",
    }[r.reason];
    return { ok: false, error };
  } catch {
    return { ok: false, error: "Couldn't claim it. Try again." };
  }
}
