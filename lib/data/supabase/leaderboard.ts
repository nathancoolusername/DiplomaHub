import "server-only";

import type { LeaderboardPage, LeaderboardPeriod, LeaderboardStanding } from "@/lib/data/types";
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
