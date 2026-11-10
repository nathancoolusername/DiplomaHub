import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { checkRateLimit, getClientIp } from "@/app/lib/ratelimit";
import { isGuestId, setReaction, type Reaction } from "@/lib/forty-five/server";
import { isLog, sameOriginJson } from "@/lib/forty-five/request";

// 👍 / 👎 on today's Forty-Five, after finishing it (body: puzzleId, reaction
// "like" | "dislike" | null; guests also send guestId and their guess log,
// which must replay to a finished game). Feeds Admin → Insights.
export async function POST(req: Request) {
  if (!sameOriginJson(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  let body: { puzzleId?: unknown; reaction?: unknown; guestId?: unknown; log?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { puzzleId, reaction } = body;
  if (typeof puzzleId !== "string" || puzzleId.length > 64 || !(reaction === "like" || reaction === "dislike" || reaction === null)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const userId = await getCurrentUserId();
  if (!userId && !(isGuestId(body.guestId) && isLog(body.log))) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const limit = await checkRateLimit("game", userId ? `ff:${userId}` : `ff-ip:${await getClientIp()}`);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  try {
    const r = await setReaction(userId ? { userId } : { guestId: body.guestId as string, log: body.log as string[][] }, puzzleId, reaction as Reaction);
    if (r !== "ok") return NextResponse.json({ error: r }, { status: 409 });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("forty-five react", e);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
