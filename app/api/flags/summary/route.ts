import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { gameDay } from "@/lib/flags/daily";
import { getBestBoard, getDailyBoard } from "@/lib/flags/server";

// Top 10 for a guest's end screen: ?mode=daily (today's sprint), all or hard. Names only. Read-only.
export async function GET(req: Request) {
  const asked = new URL(req.url).searchParams.get("mode");
  const mode = asked === "all" || asked === "hard" ? asked : "daily";
  const userId = await getCurrentUserId();
  try {
    const board = mode === "daily" ? await getDailyBoard(gameDay(), 10, 0, userId) : await getBestBoard(mode, 10, 0, userId);
    return NextResponse.json(board, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("flags summary", e);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
