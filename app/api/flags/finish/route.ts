import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { checkRateLimit } from "@/app/lib/ratelimit";
import { sameOriginJson } from "@/lib/forty-five/request";
import { finishRun } from "@/lib/flags/server";
import { isAnswerList } from "@/lib/flags/engine";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ends a signed-in run: { runId, answers: [{ code, ms }] }. The server
// re-checks every answer and times the run with the database clock.
export async function POST(req: Request) {
  if (!sameOriginJson(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "signed_out" }, { status: 401 });
  const limit = await checkRateLimit("game", `flags:${userId}`);
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  let runId: string | null = null;
  let answers: unknown = null;
  try {
    const body = await req.json();
    if (typeof body?.runId === "string" && UUID_RE.test(body.runId)) runId = body.runId;
    answers = body?.answers;
  } catch {}
  if (!runId || !isAnswerList(answers)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    const r = await finishRun(userId, runId, answers);
    if (!r.ok) return NextResponse.json({ error: r.reason }, { status: 404 });
    return NextResponse.json(r.result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("flags finish", e);
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}
