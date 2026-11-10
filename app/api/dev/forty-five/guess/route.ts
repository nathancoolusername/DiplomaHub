import { NextResponse } from "next/server";
import { devPuzzle } from "@/lib/forty-five/dev-fixture";
import { guestGuess } from "@/lib/forty-five/view";
import { isGuess, isLog } from "@/lib/forty-five/request";

// Dev only (/dev/forty-five): guest guesses against a content/ puzzle. 404 in production.
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const body = await req.json();
  const p = devPuzzle(String(body.puzzleId ?? ""));
  if (!p || !isGuess(body.words) || !isLog(body.log ?? [])) return NextResponse.json({ ok: false, reason: "invalid" }, { status: 400 });
  return NextResponse.json(guestGuess(p.groups, body.log ?? [], body.words));
}
