import "server-only";

import { createAdminClient } from "@/app/lib/supabase/admin";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { isAdmin } from "@/app/lib/admin";

// Read-only numbers for the admin pages. They come from the dp_admin_*
// database functions (migration 19), which only the service role can call,
// so every entry point checks the admin id on the server first.

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

/** Parses ?range= from the URL; anything unknown is 30 days. */
export function parseRange(value: string | string[] | undefined): Range {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 30;
}

export type Labelled = { label: string; count: number };
export type DayPoint = { date: string; count: number };

export type OverviewStats = {
  total_users: number;
  pro_users: number;
  onboarded: number;
  new_1d: number;
  new_7d: number;
  new_30d: number;
  active_1d: number;
  active_7d: number;
  active_30d: number;
  returning_7d: number;
  returning_30d: number;
  days: number;
  series: { date: string; new: number; active: number; returning: number }[];
};

export type HubStats = {
  total_users: number;
  onboarded: number;
  users_with_items: number;
  returning_users: number;
  total_items: number;
  items_window: number;
  with_timer: number;
  with_practice_set: number;
  imported: number;
  study_sessions: number;
  by_type: Labelled[];
  by_kind: Labelled[];
  by_source: Labelled[];
  top_subjects: Labelled[];
  exam_sessions: Labelled[];
  days: number;
  series: { date: string; items: number; setups: number }[];
};

export type PracticeStats = {
  students_with_subjects: number;
  practisers_all: number;
  practisers_7d: number;
  practisers_30d: number;
  sets_total: number;
  sets_saved: number;
  sets_shared: number;
  codes_redeemed: number;
  attempts_total: number;
  attempts_window: number;
  attempts_marked: number;
  attempts_open: number;
  answers_marked: number;
  points_total: number;
  questions_in_bank: number;
  by_type: Labelled[];
  subjects: { subject_id: string; name: string; students: number; attempts: number; questions: number }[];
  requests: { name: string; students: number; has_questions: boolean; last: string }[];
  requests_total: number;
  requesters: number;
  top_practisers: { name: string; points: number; sets: number }[];
  days: number;
  series: { date: string; attempts: number; sets: number; practisers: number }[];
};

export type WaitlistStats = {
  total: number;
  new_1d: number;
  new_7d: number;
  new_30d: number;
  signed_in: number;
  visitors: number;
  total_users: number;
  by_source: Labelled[];
  subjects: Labelled[];
  days: number;
  series: DayPoint[];
};

export type RunningLowStats = {
  pct: number;
  left: number;
  low_count: number;
  students_low: number;
  students: { user_id: string; name: string; subject: string; pool: "questions" | "essays"; seen: number; total: number; left: number; last_practised: string | null }[];
  subjects: { subject: string; pool: "questions" | "essays"; bank: number; students: number; over_50: number; over_80: number; done: number }[];
};

export type WaitlistEntry = { id: string; email: string; source: string | null; signedIn: boolean; createdAt: string };

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(fn: string, days: number): Promise<Result<T>> {
  if (!isAdmin(await getCurrentUserId())) return { ok: false, error: "Not authorized" };
  const { data, error } = await createAdminClient().rpc(fn, { p_days: days });
  if (error) {
    // Migration 19 not run yet is the usual cause.
    return { ok: false, error: error.message };
  }
  return { ok: true, data: data as T };
}

export const getOverviewStats = (days: number) => call<OverviewStats>("dp_admin_overview", days);
export const getHubStats = (days: number) => call<HubStats>("dp_admin_hub", days);
/** Students who have seen most of a subject's questions (migration 20). */
export async function getRunningLow(): Promise<Result<RunningLowStats>> {
  if (!isAdmin(await getCurrentUserId())) return { ok: false, error: "Not authorized" };
  const { data, error } = await createAdminClient().rpc("dp_admin_running_low", { p_pct: 0.8, p_left: 50 });
  return error ? { ok: false, error: error.message } : { ok: true, data: data as RunningLowStats };
}

export const getPracticeStats = (days: number) => call<PracticeStats>("dp_admin_practice", days);
export const getWaitlistStats = (days: number) => call<WaitlistStats>("dp_admin_waitlist", days);

/** The newest waitlist emails (admin only). */
export async function getWaitlistEntries(limit = 100): Promise<Result<WaitlistEntry[]>> {
  if (!isAdmin(await getCurrentUserId())) return { ok: false, error: "Not authorized" };
  const { data, error } = await createAdminClient()
    .from("pro_waitlist")
    .select("id, email, source, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    data: (data ?? []).map((r) => ({ id: r.id, email: r.email, source: r.source, signedIn: r.user_id !== null, createdAt: r.created_at })),
  };
}
