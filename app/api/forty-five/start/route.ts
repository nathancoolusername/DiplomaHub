import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { checkRateLimit } from "@/app/lib/ratelimit";
import { startPlay } from "@/lib/forty-five/server";
import { sameOriginJson } from "@/lib/forty-five/request";

// Forty-Five for a signed-in student: today's, or { puzzleId } for a past day
// (the archive). Body { begin: false } only looks (the page shows its intro
// first); { begin: true } records started_at (database clock) the first time;
// refreshing just returns the same play.
export async function POST(req: Request) {
  if (!sameOriginJson(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "signed_out" }, { status: 401 });
  const limit = await checkRateLimit("game", `ff:${userId}`);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  let begin = false;
  let puzzleId: string | null = null;
  try {
    const body = await req.json();
    begin = body?.begin === true;
    if (typeof body?.puzzleId === "string" && body.puzzleId.length <= 64) puzzleId = body.puzzleId;
  } catch {}
  try {
    const r = await startPlay(userId, begin, puzzleId);
    if (!r) return NextResponse.json({ error: "no_puzzle" }, { status: 404 });
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("forty-five start", e);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
