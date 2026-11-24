import "server-only";

import type { UsageItem } from "@/lib/data/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { BANNER_FEATURES, FEATURES, access, dailyCap, type UsageMetric } from "@/lib/plans";
import { check, requireUserId } from "./client";
import { getProStatus } from "./pro";
import { getViewer } from "./viewer";

// Usage for the banner. Written questions are counted from real answers;
// the Pro caps are all Bro features, which don't exist yet, so they're 0.
// TODO(phase 6): read usage_counters (with Pro periods from the subscription date).

function nextMondayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7));
  return d;
}

function nextMonthStartUtc(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

export async function getUsage(): Promise<UsageItem[]> {
  const { isPro } = await getViewer();
  return BANNER_FEATURES[isPro ? "pro" : "free"].map((feature) => {
    const a = access(feature, isPro);
    const period = a.allowed && a.period ? a.period : "month";
    return {
      feature,
      label: FEATURES[feature].label,
      used: 0,
      limit: a.allowed ? a.limit : 0,
      period,
      resetsAt: (period === "week" ? nextMondayUtc() : nextMonthStartUtc()).toISOString(),
    };
  });
}

export type UsageResult = {
  allowed: boolean;
  /** Uses counted today (UTC), including this one when allowed. */
  used: number;
  /** Today's cap; null = no cap. */
  cap: number | null;
  /** Uses left today; null = no cap. */
  remaining: number | null;
};

/**
 * Counts one use of `metric` for the signed-in student if they're under
 * today's cap (lib/plans.ts DAILY_CAPS). Check and count happen in one
 * database statement (dp_consume_usage, service role only), so two requests
 * at once can't both take the last slot. Call it BEFORE the expensive work,
 * and skip that work when `allowed` is false.
 */
export async function consumeUsage(metric: UsageMetric): Promise<UsageResult> {
  const [uid, pro] = await Promise.all([requireUserId(), getProStatus()]);
  const cap = dailyCap(metric, { isPro: pro.isPro, unlimited: pro.plan === "unlimited" });
  const { data, error } = await createAdminClient().rpc("dp_consume_usage", {
    p_user_id: uid,
    p_metric: metric,
    p_cap: cap,
  });
  check(error);
  const r = data as { allowed: boolean; used: number; cap: number | null; remaining: number | null };
  return { allowed: r.allowed, used: r.used, cap: r.cap, remaining: r.remaining };
}

/** Today's counted uses per metric (UTC day), for the Pro page's limits. */
export async function getTodayUsage(): Promise<Record<UsageMetric, number>> {
  const uid = await requireUserId();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await createAdminClient().from("usage_counters").select("metric, count").eq("user_id", uid).eq("day", today);
  check(error);
  const out: Record<UsageMetric, number> = { bro_message: 0, opus_escalation: 0, generated_question: 0 };
  for (const r of data ?? []) out[r.metric as UsageMetric] = r.count as number;
  return out;
}
