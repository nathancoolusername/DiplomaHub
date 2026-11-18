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

// ── The system features (migrations 48–55): Sunday Reset, Squads, shelf, appearance ──

export type SystemStats = {
  resets: { total: number; window: number; students: number; studentsWindow: number; avgSessions: number | null; byWeek: Labelled[] };
  squads: { total: number; window: number; members: number; inASquad: number; avgSize: number | null; solo: number; largest: number; joinsWindow: number };
  shelf: { total: number; window: number; byType: Labelled[]; adds: number };
  appearance: { accents: Labelled[]; backdrops: Labelled[]; styleTipSeen: number; homepageWaitlist: number };
  /** Tables that weren't there (a migration not run yet). */
  missing: string[];
};

/** Counts for /admin/system, straight from the tables (they're small). */
export async function getSystemStats(days: number): Promise<Result<SystemStats>> {
  if (!isAdmin(await getCurrentUserId())) return { ok: false, error: "Not authorized" };
  const sb = createAdminClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const missing: string[] = [];
  const rows = async <T,>(table: string, query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> => {
    const { data, error } = await query;
    if (error) {
      missing.push(table);
      return [];
    }
    return data ?? [];
  };
  const count = async (query: PromiseLike<{ count: number | null; error: unknown }>) => {
    const { count: n, error } = await query;
    return error ? 0 : (n ?? 0);
  };

  const [resets, squads, members, shares, accents, backdrops, styleTipSeen, homepageWaitlist] = await Promise.all([
    rows<{ user_id: string; week_start: string; sessions: number; done_at: string }>("weekly_resets", sb.from("weekly_resets").select("user_id, week_start, sessions, done_at").limit(20000)),
    rows<{ id: string; created_at: string }>("squads", sb.from("squads").select("id, created_at").limit(20000)),
    rows<{ squad_id: string; user_id: string; joined_at: string }>("squad_members", sb.from("squad_members").select("squad_id, user_id, joined_at").limit(50000)),
    rows<{ code_id: string | null; resource_id: string | null; created_at: string; share_codes: { type: string } | null }>(
      "squad_shares",
      sb.from("squad_shares").select("code_id, resource_id, created_at, share_codes(type)").limit(20000) as never,
    ),
    Promise.all(["sage", "tide", "orchid", "blossom", "ember"].map(async (a) => ({ label: a, count: await count(sb.from("users").select("id", { count: "exact", head: true }).eq("accent", a)) }))),
    Promise.all(["dawn", "aurora", "dusk"].map(async (b) => ({ label: b, count: await count(sb.from("users").select("id", { count: "exact", head: true }).eq("backdrop", b)) }))),
    count(sb.from("users").select("id", { count: "exact", head: true }).contains("dismissed_hints", ["style"])),
    count(sb.from("pro_waitlist").select("id", { count: "exact", head: true }).eq("source", "homepage")),
  ]);

  // Sunday Reset
  const inWindow = (iso: string) => iso >= since;
  const recentResets = resets.filter((r) => inWindow(r.done_at));
  const weeks = new Map<string, number>();
  for (const r of resets) weeks.set(r.week_start, (weeks.get(r.week_start) ?? 0) + 1);
  const byWeek = [...weeks.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8).map(([label, n]) => ({ label: `Week of ${label}`, count: n }));

  // Squads
  const sizes = new Map<string, number>();
  for (const m of members) sizes.set(m.squad_id, (sizes.get(m.squad_id) ?? 0) + 1);
  const sizeList = [...sizes.values()];

  // Shelf: what's shared, and how often a shelf code was then redeemed by someone else.
  const types = new Map<string, number>();
  for (const s of shares) {
    const t = s.resource_id ? "resource" : (s.share_codes?.type ?? "code");
    types.set(t, (types.get(t) ?? 0) + 1);
  }
  const codeIds = [...new Set(shares.map((s) => s.code_id).filter((x): x is string => !!x))];
  const adds = codeIds.length ? await count(sb.from("share_code_redemptions").select("code_id", { count: "exact", head: true }).in("code_id", codeIds.slice(0, 500))) : 0;
  const TYPE_LABEL: Record<string, string> = { practice_set: "Practice sets", hub_item: "Hub items (tests, deadlines)", hub_set: "Hub plans", resource: "Library resources" };

  return {
    ok: true,
    data: {
      resets: {
        total: resets.length,
        window: recentResets.length,
        students: new Set(resets.map((r) => r.user_id)).size,
        studentsWindow: new Set(recentResets.map((r) => r.user_id)).size,
        avgSessions: resets.length ? Math.round((resets.reduce((s, r) => s + r.sessions, 0) / resets.length) * 10) / 10 : null,
        byWeek,
      },
      squads: {
        total: squads.length,
        window: squads.filter((s) => inWindow(s.created_at)).length,
        members: members.length,
        inASquad: new Set(members.map((m) => m.user_id)).size,
        avgSize: sizeList.length ? Math.round((sizeList.reduce((a, b) => a + b, 0) / sizeList.length) * 10) / 10 : null,
        solo: sizeList.filter((n) => n === 1).length,
        largest: sizeList.length ? Math.max(...sizeList) : 0,
        joinsWindow: members.filter((m) => inWindow(m.joined_at)).length,
      },
      shelf: {
        total: shares.length,
        window: shares.filter((s) => inWindow(s.created_at)).length,
        byType: [...types.entries()].map(([t, n]) => ({ label: TYPE_LABEL[t] ?? t, count: n })).sort((a, b) => b.count - a.count),
        adds,
      },
      appearance: { accents, backdrops, styleTipSeen, homepageWaitlist },
      missing,
    },
  };
}
