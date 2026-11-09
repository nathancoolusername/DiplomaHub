import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { checkRateLimit, getClientIp } from "@/app/lib/ratelimit";
import { guessGuest, guessSigned } from "@/lib/forty-five/server";
import { isGuess, isLog, sameOriginJson } from "@/lib/forty-five/request";
import type { GuessResponse } from "@/lib/forty-five/types";

// Checks one Forty-Five guess on the server. Signed in: recorded on the play
// (body: puzzleId, words, expected = guesses already recorded). Guest: nothing
// stored; the browser sends its guess log so repeats and the end are known.
// Groups come back only when solved, and all of them once the game is over.
export async function POST(req: Request) {
  if (!sameOriginJson(req)) return NextResponse.json({ ok: false, reason: "error" } satisfies GuessResponse, { status: 403 });
  let body: { puzzleId?: unknown; words?: unknown; expected?: unknown; log?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid" } satisfies GuessResponse, { status: 400 });
  }
  const { puzzleId, words } = body;
  if (typeof puzzleId !== "string" || puzzleId.length > 64 || !isGuess(words)) {
    return NextResponse.json({ ok: false, reason: "invalid" } satisfies GuessResponse, { status: 400 });
  }

  const userId = await getCurrentUserId();
  const limit = await checkRateLimit("game", userId ? `ff:${userId}` : `ff-ip:${await getClientIp()}`);
  if (!limit.allowed) return NextResponse.json({ ok: false, reason: "rate_limited" } satisfies GuessResponse, { status: 429 });

  try {
    let r: GuessResponse;
    if (userId) {
      const expected = Number.isInteger(body.expected) ? (body.expected as number) : -1;
      r = await guessSigned(userId, puzzleId, words, expected);
    } else {
      const log = body.log ?? [];
      if (!isLog(log)) return NextResponse.json({ ok: false, reason: "invalid" } satisfies GuessResponse, { status: 400 });
      r = await guessGuest(puzzleId, log, words);
    }
    return NextResponse.json(r, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("forty-five guess", e);
    return NextResponse.json({ ok: false, reason: "error" } satisfies GuessResponse, { status: 500 });
  }
}
