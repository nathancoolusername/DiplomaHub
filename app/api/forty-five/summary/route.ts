import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { gameDay } from "@/lib/forty-five/dates";
import { getDailyBoard, getMyDailyStanding, getMyStats } from "@/lib/forty-five/server";

// The end screen's extras: today's top 10 (names only), and for a signed-in
// student their rank today and their stats. Read-only.
export async function GET() {
  const userId = await getCurrentUserId();
  const today = gameDay();
  try {
    const [board, standing, stats] = await Promise.all([
      getDailyBoard(today, 10, 0, userId),
      userId ? getMyDailyStanding(userId, today) : null,
      userId ? getMyStats(userId) : null,
    ]);
    return NextResponse.json({ board, standing, stats }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("forty-five summary", e);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
