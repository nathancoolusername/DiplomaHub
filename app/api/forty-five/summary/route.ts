import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { gameDay } from "@/lib/forty-five/dates";
import { getDailyBoard, getMyDailyStanding, getMyReaction, getMyStats, getPlayablePuzzle, getPuzzleLikes } from "@/lib/forty-five/server";
import { getSquadsFortyFiveToday } from "@/lib/data";

// The end screen's extras: the puzzle day's top 10 (names only), and for a
// signed-in student their rank that day, their stats and their 👍/👎, how many
// liked the puzzle, and how their squads did today (names and scores of squad
// members only). ?puzzle=<id> asks about an archive puzzle instead of today's;
// squads and stats are today-only. Read-only.
export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  const today = gameDay();
  try {
    const asked = new URL(req.url).searchParams.get("puzzle");
    const past = asked ? await getPlayablePuzzle(asked) : null;
    if (asked && !past) return NextResponse.json({ error: "no_puzzle" }, { status: 404 });
    const day = past?.date ?? today;
    const isToday = day === today;
    const [board, standing, stats, reaction, likes, squad] = await Promise.all([
      getDailyBoard(day, 10, 0, userId),
      userId ? getMyDailyStanding(userId, day) : null,
      userId && isToday ? getMyStats(userId) : null,
      userId ? getMyReaction(userId, past?.id).catch(() => null) : null, // null until migration 36 runs
      getPuzzleLikes(past?.id),
      userId && isToday ? getSquadsFortyFiveToday() : [], // [] when not in a squad (or before migration 53)
    ]);
    return NextResponse.json({ board, standing, stats, reaction, likes, squad }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("forty-five summary", e);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
