import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { checkRateLimit } from "@/app/lib/ratelimit";
import { sameOriginJson } from "@/lib/forty-five/request";
import { startRun } from "@/lib/flags/server";

// Flags for a signed-in student: { mode: "daily" | "all" }. Daily makes (or
// returns) today's one sprint; all flags resumes a live run or starts a new
// one. started_at is the database clock.
export async function POST(req: Request) {
  if (!sameOriginJson(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "signed_out" }, { status: 401 });
  const limit = await checkRateLimit("game", `flags:${userId}`);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  let mode: "daily" | "all" | null = null;
  try {
    const body = await req.json();
    if (body?.mode === "daily" || body?.mode === "all") mode = body.mode;
  } catch {}
  if (!mode) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    return NextResponse.json(await startRun(userId, mode), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("flags start", e);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
