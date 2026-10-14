import "server-only";

import type { UsageItem } from "@/lib/data/types";
import { BANNER_FEATURES, FEATURES, access } from "@/lib/plans";
import { rpc } from "./client";
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
  const writtenThisWeek = isPro ? 0 : await rpc<number>("written_questions_this_week");
  return BANNER_FEATURES[isPro ? "pro" : "free"].map((feature) => {
    const a = access(feature, isPro);
    const period = a.allowed && a.period ? a.period : "month";
    return {
      feature,
      label: FEATURES[feature].label,
      used: feature === "written_questions" ? writtenThisWeek : 0,
      limit: a.allowed ? a.limit : 0,
      period,
      resetsAt: (period === "week" ? nextMondayUtc() : nextMonthStartUtc()).toISOString(),
    };
  });
}
