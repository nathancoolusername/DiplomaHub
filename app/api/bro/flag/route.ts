import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { flagBroMessage, type BroFlagReason } from "@/lib/data";
import { sameOriginJson } from "@/lib/forty-five/request";

// "This is wrong" on a Bro reply. Any signed-in student can flag their own
// replies (even after Pro ends); flag_bro_message checks the reply is theirs.

const REASONS: BroFlagReason[] = ["wrong", "ib_fact", "unhelpful", "other"];

export async function POST(req: Request) {
  if (!sameOriginJson(req)) return NextResponse.json({ ok: false, message: "Bad request." }, { status: 403 });
  if (!(await getCurrentUserId())) return NextResponse.json({ ok: false, message: "Sign in first." }, { status: 401 });
  let body: { messageId?: unknown; reason?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Bad request." }, { status: 400 });
  }
  const { messageId, reason } = body;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) || null : null;
  if (!Number.isSafeInteger(messageId) || !REASONS.includes(reason as BroFlagReason)) {
    return NextResponse.json({ ok: false, message: "Bad request." }, { status: 400 });
  }
  try {
    await flagBroMessage(messageId as number, reason as BroFlagReason, note);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error && e.message === "Reply not found" ? "That reply is gone." : "Couldn't send the flag. Try again?";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
