import "server-only";

import type { RoomState } from "@/lib/deadline/types";
import { rpc } from "./client";

// Deadline (migration 56). Every call is a security-definer function that
// checks the caller itself; the game's own turns run from the browser
// (lib/deadline/useRoom.ts). These are the server-rendered pieces.

export type JoinRoomResult =
  | { ok: true; id: string; code: string; waiting: boolean }
  | { ok: false; reason: "not_found" | "full" | "rate_limited" | "error" };

/** Joins (or rejoins) a room by its 4-character code. */
export async function joinRoom(code: string, via: "code" | "link" | "squad"): Promise<JoinRoomResult> {
  try {
    return await rpc<JoinRoomResult>("join_room", { p_code: code, p_via: via });
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function getRoomState(code: string): Promise<RoomState | { ok: false; reason: string }> {
  try {
    return await rpc<RoomState | { ok: false; reason: string }>("get_room_state", { p_code: code });
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** A new room (for a squad: its members only); the caller is its host. */
export async function createRoom(squadId: string | null): Promise<{ id: string; code: string }> {
  return rpc<{ id: string; code: string }>("create_room", { p_squad: squadId, p_settings: {} });
}

export type DeadlineStats = { games: number; wins: number; bestStreak: number };
export type DeadlineStanding = { rank: number | null; wins: number; games: number; hidden: boolean };

/** Anyone's games, wins and best streak (the profile line); zeros before migration 56. */
export async function getDeadlineStats(userId: string): Promise<DeadlineStats> {
  try {
    const r = await rpc<{ games: number; wins: number; best_streak: number }>("public_deadline_stats", { p_user: userId });
    return { games: r?.games ?? 0, wins: r?.wins ?? 0, bestStreak: r?.best_streak ?? 0 };
  } catch {
    return { games: 0, wins: 0, bestStreak: 0 };
  }
}

export async function getMyDeadlineStanding(period: "week" | "all"): Promise<DeadlineStanding | null> {
  try {
    return await rpc<DeadlineStanding>("my_deadline_standing", { p_period: period });
  } catch {
    return null;
  }
}

export type DeadlineLeader = { rank: number; userId: string; displayName: string; avatarUrl: string | null; wins: number; games: number };

/** Most wins this week or all time. */
export async function getDeadlineLeaderboard(period: "week" | "all", limit = 50): Promise<DeadlineLeader[]> {
  try {
    const rows = await rpc<{ rank: number; user_id: string; display_name: string | null; avatar_url: string | null; wins: number; games: number }[]>(
      "deadline_leaderboard", { p_period: period, p_limit: limit, p_offset: 0 });
    return (rows ?? []).map((r) => ({
      rank: Number(r.rank), userId: r.user_id, displayName: r.display_name ?? "Someone", avatarUrl: r.avatar_url, wins: Number(r.wins), games: Number(r.games),
    }));
  } catch {
    return [];
  }
}

export type SquadDeadline = {
  rooms: { code: string; status: "lobby" | "playing"; host: string | null; players: number; inRoom: boolean }[];
  /** userId → wins. */
  wins: Map<string, { week: number; all: number }>;
};

/** The squad's open rooms and its members' wins (migration 57); null before it runs. */
export async function getSquadDeadline(squadId: string): Promise<SquadDeadline | null> {
  try {
    const r = await rpc<{ rooms: { code: string; status: "lobby" | "playing"; host: string | null; players: number; in_room: boolean }[]; wins: { user_id: string; week: number; all: number }[] }>(
      "squad_deadline", { p_squad: squadId });
    return {
      rooms: (r.rooms ?? []).map((x) => ({ code: x.code, status: x.status, host: x.host, players: Number(x.players), inRoom: x.in_room })),
      wins: new Map((r.wins ?? []).map((w) => [w.user_id, { week: Number(w.week), all: Number(w.all) }])),
    };
  } catch {
    return null;
  }
}

/** Funnel analytics from the server side (allowlisted kinds only). */
export async function logDeadlineEvent(kind: "play_page_opened" | "join_page_opened", data: Record<string, unknown> = {}): Promise<void> {
  try {
    await rpc("log_deadline_event", { p_kind: kind, p_room: null, p_data: data });
  } catch {
    /* analytics never break a page */
  }
}
