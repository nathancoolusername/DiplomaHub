import "server-only";

import { createAdminClient } from "@/app/lib/supabase/admin";
import { db } from "@/lib/data/supabase/client";
import { pdfPagesText } from "@/lib/review/pdf-text";
import { KIND_LABELS, type ReviewKind } from "@/lib/review/labels";
import type { Report } from "@/lib/review/report";

// "Ask Bro" on a coursework review comment: the browser sends only the draft id
// and the comment's index; the comment, its criterion and the review's reasoning
// are loaded here as the student (RLS: only their own drafts).

export type ReviewRef = { draftId: string; comment: number };

export function reviewRef(x: unknown): ReviewRef | null {
  if (!x || typeof x !== "object") return null;
  const { draftId, comment } = x as Record<string, unknown>;
  if (typeof draftId !== "string" || !/^[0-9a-f-]{36}$/i.test(draftId)) return null;
  if (typeof comment !== "number" || !Number.isInteger(comment) || comment < 0 || comment > 99) return null;
  return { draftId, comment };
}

type Row = {
  version: number;
  file_path: string;
  report: Report | null;
  review_projects: { kind: ReviewKind; title: string; question: string } | null;
};

/** The text block Bro gets with the student's message, or null if it isn't theirs / doesn't exist. */
export async function loadReviewCommentForBro(ref: ReviewRef): Promise<string | null> {
  const sb = await db();
  const { data } = await sb.from("review_drafts").select("version, file_path, report, review_projects(kind, title, question)").eq("id", ref.draftId).maybeSingle();
  const row = data as unknown as Row | null;
  const report = row?.report;
  const c = report?.comments?.[ref.comment];
  if (!row || !report || !c) return null;
  const crit = report.criteria.find((x) => x.id === c.criterion_id);
  // The page the comment is on and the pages either side, so Bro can see the actual work.
  // (The draft is theirs: RLS let the select above through. The file is read with the service role.)
  let pagesText = "";
  try {
    const file = await createAdminClient().storage.from("coursework").download(row.file_path);
    if (file.data) {
      const pages = await pdfPagesText(new Uint8Array(await file.data.arrayBuffer()), [c.page - 1, c.page, c.page + 1]);
      pagesText = pages.map((p) => `--- Page ${p.page} ---\n${p.text}`).join("\n\n");
    }
  } catch (e) {
    console.error("review pages for Bro", e);
  }
  const p = row.review_projects;
  return [
    `The student is asking about a comment from DiplomaHub's review of their coursework draft.`,
    `Work: ${p ? `${KIND_LABELS[p.kind]} "${p.title}"` : "coursework"}, draft ${row.version}.${p?.question ? ` Research question / title: ${p.question}` : ""}`,
    `The comment (page ${c.page}, about criterion "${c.criterion_id}", marked as ${c.kind}): ${c.comment}`,
    c.quote ? `The passage it refers to: "${c.quote}"` : "",
    crit
      ? `The review's reasoning for that criterion (${crit.mark_low === crit.mark_high ? crit.mark_low : `${crit.mark_low}–${crit.mark_high}`} marks): ${crit.why}${crit.to_raise.length ? ` To raise it: ${crit.to_raise.join(" ")}` : ""}`
      : "",
    pagesText ? `The text of the student's draft around the comment (extracted from their PDF; figures and equations may be missing or garbled):\n${pagesText}` : "",
    `How to help: explain what the comment means and why it matters for the mark, pointing to what's on their page, then help them work out the fix with questions and guidance. This is assessed coursework, so follow IB academic integrity: never write sentences, paragraphs, calculations or a research question they could paste in; describe what a stronger version does instead. You see only these pages${pagesText ? "" : " (none could be read)"}, not the whole document, so ask them to paste anything else you need.`,
  ]
    .filter(Boolean)
    .join("\n");
}
