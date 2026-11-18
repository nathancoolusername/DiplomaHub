import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { gameDay } from "@/lib/forty-five/dates";
import { getDailyBoard, getMyDailyStanding, getMyReaction, getMyStats, getTodayLikes } from "@/lib/forty-five/server";
import { getSquadsFortyFiveToday } from "@/lib/data";

// The end screen's extras: today's top 10 (names only), and for a signed-in
// student their rank today, their stats and their 👍/👎, how many liked today's puzzle, and how their
// squads did today (names and scores of squad members only). Read-only.
export async function GET() {
  const userId = await getCurrentUserId();
  const today = gameDay();
  try {
    const [board, standing, stats, reaction, likes, squad] = await Promise.all([
      getDailyBoard(today, 10, 0, userId),
      userId ? getMyDailyStanding(userId, today) : null,
      userId ? getMyStats(userId) : null,
      userId ? getMyReaction(userId).catch(() => null) : null, // null until migration 36 runs
      getTodayLikes(),
      userId ? getSquadsFortyFiveToday() : [], // [] when not in a squad (or before migration 53)
    ]);
    return NextResponse.json({ board, standing, stats, reaction, likes, squad }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("forty-five summary", e);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
