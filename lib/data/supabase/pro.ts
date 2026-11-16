import "server-only";

import { cache } from "react";
import { check, db, requireUserId, rpc } from "./client";

// DiplomaPro access, from public.entitlements (migration 30). users.is_pro and
// users.pro_expires_at are kept in step by a trigger and an hourly pg_cron
// job; the expiry is checked here too, so Pro ends on time between runs.

export type ProPlan = "beta" | "trial" | "monthly" | "one_year" | "two_year" | "unlimited";

export type ProStatus = {
  isPro: boolean;
  /** The plan behind today's access (the one running longest), null when Free. */
  plan: ProPlan | null;
  /** When Pro ends (ISO), null when Free or never (unlimited). */
  expiresAt: string | null;
  /** Whether the student hid their Pro badge from everyone else. */
  badgeHidden: boolean;
};

/** Postgres sends a never-ending timestamptz as "infinity". */
export function expiryMs(value: string | null): number | null {
  if (value === null) return null;
  if (value === "infinity") return Infinity;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/** The pure rule: Pro only while the flag is on and the expiry is still ahead. */
export function activePro(isPro: boolean | null, proExpiresAt: string | null, now = Date.now()): boolean {
  const ms = expiryMs(proExpiresAt);
  return !!isPro && ms !== null && ms > now;
}

export const getProStatus = cache(async (): Promise<ProStatus> => {
  const uid = await requireUserId();
  const sb = await db();
  const { data: u, error } = await sb.from("users").select("is_pro, pro_expires_at, hide_pro_badge").eq("id", uid).single();
  check(error);
  const isPro = activePro(u?.is_pro ?? false, u?.pro_expires_at ?? null);
  const badgeHidden = !!u?.hide_pro_badge;
  if (!isPro) return { isPro: false, plan: null, expiresAt: null, badgeHidden };

  const nowIso = new Date().toISOString();
  const { data: rows, error: e2 } = await sb
    .from("entitlements")
    .select("plan, expires_at")
    .eq("user_id", uid)
    .lte("starts_at", nowIso)
    .gt("expires_at", nowIso)
    .order("expires_at", { ascending: false })
    .limit(1);
  check(e2);
  const expires = u!.pro_expires_at as string;
  return {
    isPro: true,
    plan: (rows?.[0]?.plan as ProPlan | undefined) ?? null,
    expiresAt: expires === "infinity" ? null : expires,
    badgeHidden,
  };
});

export class ProRequiredError extends Error {
  constructor(message = "This is part of DiplomaPro") {
    super(message);
    this.name = "ProRequiredError";
  }
}

/** Guard for server actions and pages: the Pro status, or ProRequiredError. */
export async function requirePro(message?: string): Promise<ProStatus> {
  const status = await getProStatus();
  if (!status.isPro) throw new ProRequiredError(message);
  return status;
}

/** "Hide my Pro badge": other people stop seeing it; Pro itself is unchanged. */
export async function setProBadgeHidden(hidden: boolean): Promise<void> {
  await rpc("set_pro_badge_hidden", { p_hidden: hidden });
}
