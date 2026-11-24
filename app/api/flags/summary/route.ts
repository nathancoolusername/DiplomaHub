import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { gameDay } from "@/lib/flags/daily";
import { getAllBoard, getDailyBoard } from "@/lib/flags/server";

// Top 10 for a guest's end screen: ?mode=daily (today's sprint) or all. Names only. Read-only.
export async function GET(req: Request) {
  const mode = new URL(req.url).searchParams.get("mode") === "all" ? "all" : "daily";
  const userId = await getCurrentUserId();
  try {
    const board = mode === "daily" ? await getDailyBoard(gameDay(), 10, 0, userId) : await getAllBoard(10, 0, userId);
    return NextResponse.json(board, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("flags summary", e);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
