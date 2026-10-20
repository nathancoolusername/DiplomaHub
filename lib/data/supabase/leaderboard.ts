import "server-only";

import type { LeaderboardPage, LeaderboardPeriod, LeaderboardStanding } from "@/lib/data/types";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { check, db, requireUserId, rpc } from "./client";

// Practice points (migration 15): every marked set earns 1 point per mark
// plus 1 per 5 minutes practised (time capped per question). The leaderboard
// is public; standings and points rows are the student's own.

/** Public: one page of the leaderboard (works signed out). */
export async function getLeaderboard(period: LeaderboardPeriod, page = 1, pageSize = 20): Promise<LeaderboardPage> {
  type Row = { rank: number; display_name: string | null; avatar_url: string | null; points: number; is_me: boolean };
  const r = await rpc<{ total: number; rows: Row[] }>("leaderboard", {
    p_period: period,
    p_limit: pageSize,
    p_offset: (Math.max(1, page) - 1) * pageSize,
  });
  return {
    total: r.total ?? 0,
    rows: (r.rows ?? []).map((x) => ({
      rank: x.rank,
      displayName: x.display_name ?? "Student",
      avatarUrl: x.avatar_url ?? null,
      points: x.points,
      isMe: !!x.is_me,
    })),
  };
}

/** The signed-in student's points and rank (rank null while hidden or on 0 points). */
export async function getMyStanding(period: LeaderboardPeriod): Promise<LeaderboardStanding> {
  const r = await rpc<{ points: number; rank: number | null; total: number; hidden: boolean }>("my_leaderboard_standing", { p_period: period });
  return { points: r.points ?? 0, rank: r.rank ?? null, total: r.total ?? 0, hidden: !!r.hidden, period };
}

/** Points one marked set earned (null until it's marked). */
export async function getAttemptPoints(attemptId: string): Promise<number | null> {
  await requireUserId();
  const { data, error } = await (await db()).from("practice_points").select("points").eq("attempt_id", attemptId).maybeSingle();
  check(error);
  return data?.points ?? null;
}

export async function setLeaderboardHidden(hidden: boolean): Promise<void> {
  await rpc("set_leaderboard_hidden", { p_hidden: hidden });
}

// ── Contribution: the site's original points (users.points) ────────────
// Earned for sharing resources and articles and for the likes, downloads and
// views they get (award_points). Read straight from users, like profile pages
// do; students who hid themselves from the leaderboard are left out here too.

/** Public: one page of the Contribution board. */
export async function getContributionBoard(page = 1, pageSize = 20): Promise<LeaderboardPage> {
  const sb = await db();
  const me = await getCurrentUserId();
  const from = (Math.max(1, page) - 1) * pageSize;
  const { data, error, count } = await sb
    .from("public_profiles")
    .select("id, display_name, avatar_url, points", { count: "exact" })
    .gt("points", 0)
    .eq("hide_from_leaderboard", false)
    .order("points", { ascending: false })
    .order("created_at", { ascending: true })
    .range(from, from + pageSize - 1);
  check(error);
  type Row = { id: string; display_name: string | null; avatar_url: string | null; points: number };
  const rows = (data ?? []) as Row[];
  // Equal points share a rank (within the page; ties across a page break are rare and harmless).
  let rank = from;
  return {
    total: count ?? 0,
    rows: rows.map((r, i) => {
      if (i === 0 || r.points !== rows[i - 1].points) rank = from + i + 1;
      return { rank, displayName: r.display_name || "Student", avatarUrl: r.avatar_url, points: r.points, isMe: r.id === me, userId: r.id };
    }),
  };
}

/** The signed-in student's contribution points and rank (rank null while hidden or on 0). */
export async function getMyContribution(): Promise<{ points: number; rank: number | null; hidden: boolean }> {
  const uid = await requireUserId();
  const sb = await db();
  const { data, error } = await sb.from("users").select("points, hide_from_leaderboard").eq("id", uid).single();
  check(error);
  const points = data?.points ?? 0;
  const hidden = !!data?.hide_from_leaderboard;
  if (hidden || points <= 0) return { points, rank: null, hidden };
  const ahead = await sb.from("public_profiles").select("id", { count: "exact", head: true }).gt("points", points).eq("hide_from_leaderboard", false);
  check(ahead.error);
  return { points, rank: (ahead.count ?? 0) + 1, hidden };
}
