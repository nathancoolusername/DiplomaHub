import "server-only";

import { createAdminClient } from "@/app/lib/supabase/admin";
import { subjectById } from "@/lib/catalog";
import { criteriaFor } from "./criteria";
import type { ReviewKind, ReviewLevel } from "./labels";
import { reviewContext } from "./context";
import { PRECHECK_MODEL, REVIEW_MODEL, precheckTask } from "./prompt";
import { addUsage, anthropic, markPdf, type Tokens } from "./mark";
import { PRECHECK_SCHEMA, type Precheck, type Report } from "./report";

// The two model steps of a coursework review, run on the server with the
// service-role client (the student's session is checked by the caller):
//   precheckDraft: Haiku reads the PDF and checks it's readable, the right
//                  kind of work, anonymous and within the limits. Free.
//   markDraft:     Opus marks it against the criteria, then moderates its own
//                  marking in a second pass. The PDF and task are cached, so
//                  the second pass reads them at a tenth of the price.

export const BUCKET = "coursework";


type DraftRow = {
  id: string;
  user_id: string;
  version: number;
  file_path: string;
  project_id: string;
  review_projects: { kind: ReviewKind; subject_id: string | null; title: string; question: string };
};


async function loadDraft(draftId: string): Promise<{ draft: DraftRow; pdf: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("review_drafts")
    .select("id, user_id, version, file_path, project_id, review_projects!inner(kind, subject_id, title, question)")
    .eq("id", draftId)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Draft not found");
  const draft = data as unknown as DraftRow;
  const file = await admin.storage.from(BUCKET).download(draft.file_path);
  if (file.error || !file.data) throw new Error("The file couldn't be read");
  const bytes = Buffer.from(await file.data.arrayBuffer());
  if (bytes.subarray(0, 5).toString("latin1") !== "%PDF-") throw new Error("That file isn't a PDF");
  return { draft, pdf: bytes.toString("base64") };
}

const subjectName = (id: string | null) => (id ? (subjectById(id as Parameters<typeof subjectById>[0])?.name ?? id) : null);


/** Reads the PDF with Haiku and saves the pre-check. Returns it. */
export async function precheckDraft(draftId: string): Promise<Precheck> {
  const { draft, pdf } = await loadDraft(draftId);
  const p = draft.review_projects;
  const { data: lv } = await createAdminClient().from("review_projects").select("level").eq("id", draft.project_id).maybeSingle(); // null before migration 66
    const ctx = await reviewContext(draft.user_id, p.subject_id, ((lv as { level?: ReviewLevel | null } | null)?.level ?? null));
    const set = criteriaFor(p.kind, p.subject_id, ctx);
  if (!set) throw new Error("This subject's IA can't be reviewed yet");

  const stream = anthropic().messages.stream({
    model: PRECHECK_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low", format: { type: "json_schema", schema: PRECHECK_SCHEMA as unknown as Record<string, unknown> } },
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf } },
          { type: "text", text: precheckTask(p.kind, subjectName(p.subject_id), set.rules) },
        ],
      },
    ],
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal" || msg.stop_reason === "max_tokens") throw new Error("The file couldn't be checked");
  const precheck = JSON.parse(msg.content.map((b) => (b.type === "text" ? b.text : "")).join("")) as Precheck;

  const tokens: Tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  addUsage(tokens, msg.usage);
  const { error } = await createAdminClient()
    .from("review_drafts")
    .update({
      precheck,
      status: "checked",
      error: null,
      input_tokens: tokens.input,
      output_tokens: tokens.output,
      cache_read_tokens: tokens.cacheRead,
      cache_write_tokens: tokens.cacheWrite,
    })
    .eq("id", draftId);
  if (error) throw new Error(error.message);
  return precheck;
}

/**
 * Marks a draft that dp_claim_review has already moved to "marking". Saves the
 * report (status done) or the error (status failed, and the claim refunded so
 * the failure costs the student nothing).
 */
export async function markDraft(draftId: string): Promise<void> {
  const admin = createAdminClient();
  const tokens: Tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  const { data: before } = await admin.from("review_drafts").select("input_tokens, output_tokens, cache_read_tokens, cache_write_tokens").eq("id", draftId).single();
  try {
    const { draft, pdf } = await loadDraft(draftId);
    const p = draft.review_projects;
    const { data: lv } = await createAdminClient().from("review_projects").select("level").eq("id", draft.project_id).maybeSingle(); // null before migration 66
    const ctx = await reviewContext(draft.user_id, p.subject_id, ((lv as { level?: ReviewLevel | null } | null)?.level ?? null));
    const set = criteriaFor(p.kind, p.subject_id, ctx);
    if (!set) throw new Error("This subject's IA can't be reviewed yet");

    // The previous draft's report, for "what changed".
    const { data: prevRow } = await admin
      .from("review_drafts")
      .select("report")
      .eq("project_id", draft.project_id)
      .eq("status", "done")
      .lt("version", draft.version)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const previous = (prevRow?.report as Report | null) ?? null;

    const level = set.criteria.some((c) => c.level) ? (ctx.level ?? "SL") : ctx.level;
    const { report } = await markPdf(pdf, set, { kind: p.kind, level, subjectName: subjectName(p.subject_id), title: p.title, question: p.question, version: draft.version, previous }, tokens);

    await save({ status: "done", report, error: null });
  } catch (e) {
    console.error("review failed", draftId, e);
    await save({ status: "failed", error: e instanceof Error ? e.message.slice(0, 300) : "The review failed" });
    await admin.from("review_claims").update({ refunded: true }).eq("draft_id", draftId).eq("refunded", false);
  }

  async function save(fields: Record<string, unknown>) {
    await admin
      .from("review_drafts")
      .update({
        ...fields,
        model: REVIEW_MODEL,
        finished_at: new Date().toISOString(),
        input_tokens: (before?.input_tokens ?? 0) + tokens.input,
        output_tokens: (before?.output_tokens ?? 0) + tokens.output,
        cache_read_tokens: (before?.cache_read_tokens ?? 0) + tokens.cacheRead,
        cache_write_tokens: (before?.cache_write_tokens ?? 0) + tokens.cacheWrite,
      })
      .eq("id", draftId);
  }
}
