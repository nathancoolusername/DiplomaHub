import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getProStatus } from "@/lib/data";
import { getOwnDraft } from "@/lib/data/supabase/reviews";
import { precheckDraft } from "@/lib/review/run";
import { sameOriginJson } from "@/lib/forty-five/request";

// POST: the free pre-check of an uploaded draft (Pro). Returns { precheck }.
export const maxDuration = 120;

export async function POST(req: Request, ctx: { params: Promise<{ draftId: string }> }) {
  if (!sameOriginJson(req)) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  if (!(await getCurrentUserId())) return NextResponse.json({ error: "signed_out" }, { status: 401 });
  if (!(await getProStatus()).isPro) return NextResponse.json({ error: "pro_required" }, { status: 403 });
  const { draftId } = await ctx.params;
  const draft = await getOwnDraft(draftId);
  if (!draft) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (draft.status !== "uploading" && draft.status !== "checked") return NextResponse.json({ error: "already_started" }, { status: 409 });
  try {
    return NextResponse.json({ precheck: await precheckDraft(draftId) });
  } catch (e) {
    console.error("review precheck failed", draftId, e);
    return NextResponse.json({ error: "check_failed", message: e instanceof Error ? e.message : "The check failed" }, { status: 500 });
  }
}
