import "server-only";

import { createAdminClient } from "@/app/lib/supabase/admin";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { isAdmin } from "@/app/lib/admin";

// What people actually use: read straight from the feature tables with the
// service role (admin only). Admin accounts and Deadline guests are left out
// so the numbers are real students. Library downloads have no dates, so the
// library only counts likes, saves and comments.

const DAY = 86_400_000;

export type FeatureUsage = {
  key: string;
  label: string;
  href: string;
  users7d: number;
  usersRange: number;
  eventsRange: number;
  /** Share of this week's active students who used it this week. */
  shareOfActive: number;
  note?: string;
};

export type UsageStats = {
  days: number;
  active7d: number;
  features: FeatureUsage[];
  /** Weekly actives, newest first; `back` = how many were active again the week after. */
  weeks: { label: string; active: number; back: number | null }[];
  funnel: { newUsers: number; steps: { label: string; users: number }[] };
  /** Signed up 8–45 days ago: came back a week or more after signing up, by what they did. */
  returnBy: { cohort: number; cameBack: number; groups: { label: string; users: number; back: number }[] };
  practice: { setsCreated: number; started: number; marked: number; leftOpen: number; stuckMarking: number };
  requests: { label: string; count: number }[];
  missing: string[];
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function getUsageStats(days: number): Promise<Result<UsageStats>> {
  const me = await getCurrentUserId();
  if (!isAdmin(me)) return { ok: false, error: "Not authorized" };
  const sb = createAdminClient();
  const now = Date.now();
  const iso = (d: number) => new Date(now - d * DAY).toISOString();
  const span = Math.max(days, 56); // weekly retention needs 8 weeks, return rates need 45 days
  const missing: string[] = [];

  /** All rows of a small select since a date, 1000 at a time. */
  async function rows<T>(table: string, select: string, tsCol: string, sinceDays: number): Promise<T[]> {
    const out: T[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb
        .from(table)
        .select(select)
        .gte(tsCol, tsCol === "day" ? iso(sinceDays).slice(0, 10) : iso(sinceDays))
        .range(from, from + 999);
      if (error) {
        missing.push(table);
        return out;
      }
      out.push(...((data ?? []) as T[]));
      if (!data || data.length < 1000) return out;
    }
  }

  type U = { user_id: string | null; at: string };
  const load = async (table: string, userCol: string, tsCol: string): Promise<U[]> =>
    (await rows<Record<string, string | null>>(table, `${userCol}, ${tsCol}`, tsCol, span)).map((r) => ({ user_id: r[userCol], at: r[tsCol] ?? "" }));

  const [users, days_, sets, attempts, hub, ff, ffGuests, squads, resets, results, bro, likes, saves, comments, requests, waitlist, subjects] =
    await Promise.all([
      rows<{ id: string; created_at: string; is_guest: boolean | null }>("users", "id, created_at, is_guest", "created_at", span),
      rows<{ user_id: string; day: string }>("user_activity_days", "user_id, day", "day", span),
      rows<{ id: string; owner_id: string; created_at: string }>("practice_sets", "id, owner_id, created_at", "created_at", span),
      rows<{ set_id: string; user_id: string; status: string; started_at: string; finished_at: string | null }>(
        "attempts",
        "set_id, user_id, status, started_at, finished_at",
        "started_at",
        span,
      ),
      load("hub_items", "owner_id", "created_at"),
      load("forty_five_plays", "user_id", "finished_at"),
      rows<{ created_at: string }>("forty_five_guest_finishes", "created_at", "created_at", span),
      load("squad_members", "user_id", "joined_at"),
      load("weekly_resets", "user_id", "done_at"),
      load("student_results", "user_id", "created_at"),
      load("bro_messages", "user_id", "created_at"),
      load("likes", "user_id", "created_at"),
      load("saved_items", "user_id", "created_at"),
      load("comments", "user_id", "created_at"),
      rows<{ user_id: string; subject_name: string; level: string | null; created_at: string }>(
        "subject_requests",
        "user_id, subject_name, level, created_at",
        "created_at",
        span,
      ),
      load("pro_waitlist", "user_id", "created_at"),
      load("user_subjects", "user_id", "created_at"),
    ]);

  // Real students only: no admins, no Deadline guests.
  const guests = new Set(users.filter((u) => u.is_guest).map((u) => u.id));
  const real = (id: string | null | undefined): id is string => !!id && !isAdmin(id) && !guests.has(id);
  const within = (at: string, d: number) => at >= iso(d);
  const who = (list: U[], d: number) => new Set(list.filter((r) => real(r.user_id) && within(r.at, d)).map((r) => r.user_id as string));

  // Active students per week (0 = the last 7 days).
  const byWeek: Set<string>[] = Array.from({ length: 8 }, () => new Set());
  for (const r of days_) {
    if (!real(r.user_id)) continue;
    const w = Math.floor((now - Date.parse(`${r.day}T12:00:00Z`)) / (7 * DAY));
    if (w >= 0 && w < 8) byWeek[w].add(r.user_id);
  }
  const active7d = byWeek[0].size;
  const weeks = byWeek.map((set, w) => ({
    label: w === 0 ? "This week" : w === 1 ? "Last week" : `${w} weeks ago`,
    active: set.size,
    back: w === 0 ? null : [...set].filter((u) => byWeek[w - 1].has(u)).length,
  }));

  // Feature reach.
  const setsU: U[] = sets.map((s) => ({ user_id: s.owner_id, at: s.created_at }));
  const finishedU: U[] = attempts.filter((a) => a.finished_at).map((a) => ({ user_id: a.user_id, at: a.finished_at as string }));
  const library = [...likes, ...saves, ...comments];
  const defs: { table: string; key: string; label: string; href: string; list: U[]; note?: string; extra?: number }[] = [
    { table: "practice_sets", key: "sets", label: "Built a practice set", href: "/admin/practice", list: setsU },
    { table: "attempts", key: "finished", label: "Finished a practice set", href: "/admin/practice", list: finishedU },
    { table: "hub_items", key: "hub", label: "Added to the Hub", href: "/admin/hub", list: hub },
    {
      table: "forty_five_plays", key: "ff",
      label: "Played Forty-Five",
      href: "/admin/forty-five",
      list: ff,
      extra: ffGuests.filter((g) => within(g.created_at, days)).length,
    },
    { table: "squad_members", key: "squads", label: "Joined a squad", href: "/admin/system", list: squads },
    { table: "weekly_resets", key: "reset", label: "Did a Sunday Reset", href: "/admin/system", list: resets },
    { table: "student_results", key: "progress", label: "Logged a result (Progress)", href: "/admin/hub", list: results },
    { table: "bro_messages", key: "bro", label: "Talked to Bro", href: "/admin/bro", list: bro },
    { table: "likes", key: "library", label: "Liked, saved or commented", href: "/admin/content", list: library, note: "Downloads have no dates, so they aren't here" },
    { table: "subject_requests", key: "requests", label: "Asked for a subject", href: "/admin/practice", list: requests.map((r) => ({ user_id: r.user_id, at: r.created_at })) },
    { table: "pro_waitlist", key: "waitlist", label: "Joined the Pro waitlist", href: "/admin/waitlist", list: waitlist },
  ];
  const features: FeatureUsage[] = defs
    .filter((f) => !missing.includes(f.table))
    .map((f) => {
      const w = who(f.list, 7).size;
      return {
        key: f.key,
        label: f.label,
        href: f.href,
        users7d: w,
        usersRange: who(f.list, days).size,
        eventsRange: f.list.filter((r) => real(r.user_id) && within(r.at, days)).length,
        shareOfActive: active7d ? w / active7d : 0,
        note: f.extra ? `+ ${f.extra.toLocaleString()} guest finishes` : f.note,
      };
    })
    .sort((a, b) => b.users7d - a.users7d || b.usersRange - a.usersRange);

  // New students in the range: how far they got.
  const newIds = new Set(users.filter((u) => real(u.id) && within(u.created_at, days)).map((u) => u.id));
  const ever = (list: U[]) => new Set(list.filter((r) => real(r.user_id)).map((r) => r.user_id as string));
  const count = (s: Set<string>) => [...newIds].filter((u) => s.has(u)).length;
  const funnel = {
    newUsers: newIds.size,
    steps: [
      { label: "Picked their subjects", users: count(ever(subjects)) },
      { label: "Built a practice set", users: count(ever(setsU)) },
      { label: "Added to the Hub", users: count(ever(hub)) },
      { label: "Finished a practice set", users: count(ever(finishedU)) },
      { label: "Played Forty-Five", users: count(ever(ff)) },
      { label: "Asked for a subject", users: count(ever(requests.map((r) => ({ user_id: r.user_id, at: r.created_at })))) },
      { label: "Logged a result", users: count(ever(results)) },
    ].sort((x, y) => y.users - x.users),
  };

  // Return rate by what they did: signed up 8–45 days ago, active again 7+ days after signing up.
  const signup = new Map(users.filter((u) => real(u.id) && !within(u.created_at, 8) && within(u.created_at, 45)).map((u) => [u.id, u.created_at.slice(0, 10)]));
  const back = new Set<string>();
  for (const r of days_) {
    const s = signup.get(r.user_id);
    if (s && Date.parse(r.day) - Date.parse(s) >= 7 * DAY) back.add(r.user_id);
  }
  const finishedEver = ever(finishedU);
  const groupsDef: [string, Set<string>][] = [
    ["Finished a practice set", finishedEver],
    ["Built a set, never finished one", new Set([...ever(setsU)].filter((u) => !finishedEver.has(u)))],
    ["Added to the Hub", ever(hub)],
    ["Played Forty-Five", ever(ff)],
  ];
  const anything = new Set(groupsDef.flatMap(([, s]) => [...s]));
  groupsDef.push(["Did none of these", new Set([...signup.keys()].filter((u) => !anything.has(u)))]);
  const returnBy = {
    cohort: signup.size,
    cameBack: back.size,
    groups: groupsDef.map(([label, s]) => {
      const members = [...signup.keys()].filter((u) => s.has(u));
      return { label, users: members.length, back: members.filter((u) => back.has(u)).length };
    }),
  };

  // Practice: do sets get finished?
  const rangeAttempts = attempts.filter((a) => real(a.user_id) && within(a.started_at, days));
  const practice = {
    setsCreated: sets.filter((s) => real(s.owner_id) && within(s.created_at, days)).length,
    started: new Set(rangeAttempts.map((a) => a.set_id)).size,
    marked: rangeAttempts.filter((a) => a.status === "marked").length,
    leftOpen: rangeAttempts.filter((a) => a.status === "in_progress").length,
    // Marking takes seconds; an hour in "marking" means it got stuck.
    stuckMarking: rangeAttempts.filter((a) => a.status === "marking" && !within(a.finished_at ?? a.started_at, 1 / 24)).length,
  };

  // Most requested subjects in the range.
  const req = new Map<string, Set<string>>();
  for (const r of requests) {
    if (!real(r.user_id) || !within(r.created_at, days)) continue;
    const label = r.level ? `${r.subject_name} ${r.level}` : r.subject_name;
    if (!req.has(label)) req.set(label, new Set());
    req.get(label)!.add(r.user_id);
  }
  const topRequests = [...req.entries()].map(([label, s]) => ({ label, count: s.size })).sort((a, b) => b.count - a.count).slice(0, 12);

  return { ok: true, data: { days, active7d, features, weeks, funnel, returnBy, practice, requests: topRequests, missing: [...new Set(missing)] } };
}
