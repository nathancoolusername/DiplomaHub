// Deadline's clock. The server decides when a turn ends; the browser only
// animates it, corrected by the gap between its clock and the server's.

import type { RoomRound } from "./types";

/** ms to add to Date.now() to get the server's time (from get_room_state's server_now). */
export function clockOffset(serverNow: string, receivedAt = Date.now()): number {
  return Date.parse(serverNow) - receivedAt;
}

/** When the current turn ends, in server time (ms since epoch). */
export function turnEndsAt(round: Pick<RoomRound, "turn_started_at" | "turn_ms">): number {
  return Date.parse(round.turn_started_at) + round.turn_ms;
}

/** 0 at the start of the turn → 1 at the deadline. */
export function turnProgress(round: Pick<RoomRound, "turn_started_at" | "turn_ms">, offset: number, now = Date.now()): number {
  const t = now + offset - Date.parse(round.turn_started_at);
  return Math.min(1, Math.max(0, t / round.turn_ms));
}
