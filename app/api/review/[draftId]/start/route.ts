import { NextResponse, after } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getProStatus } from "@/lib/data";
import { claimReview, getOwnDraft } from "@/lib/data/supabase/reviews";
import { markDraft } from "@/lib/review/run";
import { sameOriginJson } from "@/lib/forty-five/request";

// POST: starts the full review of a pre-checked draft (Pro, 6 a month). The
// claim (cap check + status "marking") happens in one database step; the
// marking itself runs after the response, and the page polls for the result.
// A review that fails is refunded (lib/review/run.ts).
export const maxDuration = 300;

export async function POST(req: Request, ctx: { params: Promise<{ draftId: string }> }) {
  if (!sameOriginJson(req)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (!(await getCurrentUserId())) return NextResponse.json({ error: "signed_out" }, { status: 401 });
  if (!(await getProStatus()).isPro) return NextResponse.json({ error: "pro_required" }, { status: 403 });
  const { draftId } = await ctx.params;
  const draft = await getOwnDraft(draftId);
  if (!draft) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!draft.precheck?.readable) return NextResponse.json({ error: "not_checked", message: "Check the file first." }, { status: 409 });

  let claim;
  try {
    claim = await claimReview(draftId);
  } catch (e) {
    return NextResponse.json({ error: "cant_start", message: e instanceof Error ? e.message : "Couldn't start" }, { status: 409 });
  }
  if (!claim.allowed) return NextResponse.json({ error: "cap", message: "You've used this month's reviews." }, { status: 429 });

  after(() => markDraft(draftId));
  return NextResponse.json({ started: true, remaining: claim.remaining }, { status: 202 });
}
