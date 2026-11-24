import "server-only";

import { createAdminClient } from "@/app/lib/supabase/admin";
import { REVIEWS_PER_MONTH, type ReviewKind, type ReviewLevel } from "@/lib/review/labels";
import type { Precheck, Report } from "@/lib/review/report";
import { BUCKET } from "@/lib/review/run";
import { check, db, requireUserId } from "./client";
import { getProStatus } from "./pro";

// Coursework reviews (migration 65). Projects and drafts are read as the
// student (RLS: own rows only). Creating drafts, the monthly allowance and the
// files go through the service-role client, after checking the session here.

export type ReviewStatus = "uploading" | "checked" | "marking" | "done" | "failed";

export type ReviewDraft = {
  id: string;
  version: number;
  fileName: string;
  status: ReviewStatus;
  precheck: Precheck | null;
  report: Report | null;
  error: string | null;
  claimedAt: string | null;
  finishedAt: string | null;
  donePriorities: number[];
  createdAt: string;
};

export type ReviewProject = {
  id: string;
  kind: ReviewKind;
  subjectId: string | null;
  /** SL/HL chosen for this project (filled in from their subjects); null = use their subjects. */
  level: ReviewLevel | null;
  title: string;
  question: string;
  createdAt: string;
  updatedAt: string;
  drafts: ReviewDraft[];
};

export type ReviewAllowance = { used: number; cap: number | null; remaining: number | null; resetsAt: string };

/** Migration 65 hasn't run yet (PostgREST can't find the tables). */
export class ReviewsNotReadyError extends Error {
  constructor() {
    super("Coursework reviews aren't set up in the database yet");
    this.name = "ReviewsNotReadyError";
  }
}

function checkReview(error: { message: string; code?: string } | null): void {
  if (error && (error.code === "PGRST205" || error.code === "42P01" || /schema cache|does not exist/.test(error.message))) throw new ReviewsNotReadyError();
  check(error);
}

/** Migration 66 adds review_projects.level; until it has run, read and write without it. */
const missingLevel = (e: { code?: string; message: string } | null) => !!e && (e.code === "42703" || /column .*level/.test(e.message));
const projectCols = (withLevel: boolean) =>
  `id, kind, subject_id, ${withLevel ? "level, " : ""}title, question, created_at, updated_at, review_drafts(${DRAFT_COLS})`;

const DRAFT_COLS = "id, version, file_name, status, precheck, report, error, claimed_at, finished_at, done_priorities, created_at";

type DraftDb = {
  id: string;
  version: number;
  file_name: string;
  status: ReviewStatus;
  precheck: Precheck | null;
  report: Report | null;
  error: string | null;
  claimed_at: string | null;
  finished_at: string | null;
  done_priorities: number[] | null;
  created_at: string;
};

const toDraft = (d: DraftDb): ReviewDraft => ({
  id: d.id,
  version: d.version,
  fileName: d.file_name,
  status: d.status,
  precheck: d.precheck,
  report: d.report,
  error: d.error,
  claimedAt: d.claimed_at,
  finishedAt: d.finished_at,
  donePriorities: d.done_priorities ?? [],
  createdAt: d.created_at,
});

type ProjectDb = {
  id: string;
  kind: ReviewKind;
  subject_id: string | null;
  level?: ReviewLevel | null;
  title: string;
  question: string;
  created_at: string;
  updated_at: string;
  review_drafts: DraftDb[];
};

const toProject = (p: ProjectDb): ReviewProject => ({
  id: p.id,
  kind: p.kind,
  subjectId: p.subject_id,
  level: p.level ?? null,
  title: p.title,
  question: p.question,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
  drafts: (p.review_drafts ?? []).map(toDraft).sort((a, b) => b.version - a.version),
});

export async function getReviewProjects(): Promise<ReviewProject[]> {
  const sb = await db();
  const run = (withLevel: boolean) => sb.from("review_projects").select(projectCols(withLevel)).order("updated_at", { ascending: false });
  let { data, error } = await run(true);
  if (missingLevel(error)) ({ data, error } = await run(false));
  checkReview(error);
  return ((data ?? []) as unknown as ProjectDb[]).map(toProject);
}

export async function getReviewProject(id: string): Promise<ReviewProject | null> {
  const sb = await db();
  const run = (withLevel: boolean) => sb.from("review_projects").select(projectCols(withLevel)).eq("id", id).maybeSingle();
  let { data, error } = await run(true);
  if (missingLevel(error)) ({ data, error } = await run(false));
  checkReview(error);
  return data ? toProject(data as unknown as ProjectDb) : null;
}

/** This month's full reviews (UTC month; failed ones are refunded and don't count). */
export async function getReviewAllowance(): Promise<ReviewAllowance> {
  const [uid, pro] = await Promise.all([requireUserId(), getProStatus()]);
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const resetsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
  const { count, error } = await createAdminClient()
    .from("review_claims")
    .select("id", { count: "exact", head: true })
    .eq("user_id", uid)
    .eq("refunded", false)
    .gte("claimed_at", monthStart.toISOString());
  checkReview(error);
  const cap = reviewCap(pro.plan === "unlimited");
  const used = count ?? 0;
  return { used, cap, remaining: cap === null ? null : Math.max(0, cap - used), resetsAt };
}

/** The monthly cap: 6 for Pro, none for the admin's unlimited plan. */
export function reviewCap(unlimited: boolean): number | null {
  return unlimited ? null : REVIEWS_PER_MONTH;
}

export async function createReviewProject(input: { kind: ReviewKind; subjectId: string | null; level: ReviewLevel | null; title: string; question: string }): Promise<string> {
  const uid = await requireUserId();
  const sb = await db();
  let { data, error } = await sb
    .from("review_projects")
    .insert({ user_id: uid, kind: input.kind, subject_id: input.subjectId, title: input.title, question: input.question, ...(input.level ? { level: input.level } : {}) })
    .select("id")
    .single();
  if (missingLevel(error)) {
    // Migration 66 not run yet: save without the level (marking falls back to their subjects).
    ({ data, error } = await sb.from("review_projects").insert({ user_id: uid, kind: input.kind, subject_id: input.subjectId, title: input.title, question: input.question }).select("id").single());
  }
  checkReview(error);
  return data!.id as string;
}

export async function setReviewProjectLevel(id: string, level: ReviewLevel): Promise<void> {
  const sb = await db();
  const { error } = await sb.from("review_projects").update({ level, updated_at: new Date().toISOString() }).eq("id", id);
  checkReview(error);
}

export async function updateReviewProject(id: string, fields: { title: string; question: string }): Promise<void> {
  const sb = await db();
  const { error } = await sb.from("review_projects").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", id);
  check(error);
}

/** Deletes a project, its drafts and their files. */
export async function deleteReviewProject(id: string): Promise<void> {
  const uid = await requireUserId();
  const admin = createAdminClient();
  const { data: drafts, error } = await admin.from("review_drafts").select("file_path").eq("project_id", id).eq("user_id", uid);
  check(error);
  const paths = (drafts ?? []).map((d) => d.file_path as string);
  if (paths.length) await admin.storage.from(BUCKET).remove(paths);
  const sb = await db();
  const { error: e2 } = await sb.from("review_projects").delete().eq("id", id);
  check(e2);
}

export async function deleteReviewDraft(id: string): Promise<void> {
  const uid = await requireUserId();
  const admin = createAdminClient();
  const { data, error } = await admin.from("review_drafts").select("file_path").eq("id", id).eq("user_id", uid).maybeSingle();
  check(error);
  if (!data) return;
  await admin.storage.from(BUCKET).remove([data.file_path as string]);
  const sb = await db();
  const { error: e2 } = await sb.from("review_drafts").delete().eq("id", id);
  check(e2);
}

/**
 * A new draft row and a signed URL the browser uploads the PDF to directly
 * (so big files don't pass through a serverless function).
 */
export async function createDraftUpload(projectId: string, fileName: string, bytes: number): Promise<{ draftId: string; path: string; token: string }> {
  const uid = await requireUserId();
  const sb = await db();
  const { data: project, error } = await sb.from("review_projects").select("id").eq("id", projectId).maybeSingle();
  check(error);
  if (!project) throw new Error("Project not found");

  const admin = createAdminClient();
  const { data: last } = await admin.from("review_drafts").select("version").eq("project_id", projectId).order("version", { ascending: false }).limit(1).maybeSingle();
  const version = ((last?.version as number | undefined) ?? 0) + 1;
  const draftId = crypto.randomUUID();
  const path = `${uid}/${projectId}/${draftId}.pdf`;
  const { error: e2 } = await admin.from("review_drafts").insert({
    id: draftId,
    project_id: projectId,
    user_id: uid,
    version,
    file_path: path,
    file_name: fileName.slice(0, 200),
    file_bytes: bytes,
  });
  check(e2);
  const signed = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (signed.error || !signed.data) throw new Error(signed.error?.message ?? "Upload couldn't start");
  await sb.from("review_projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
  return { draftId, path, token: signed.data.token };
}

/** The draft, if it belongs to the signed-in student. */
export async function getOwnDraft(id: string): Promise<(ReviewDraft & { projectId: string }) | null> {
  const sb = await db();
  const { data, error } = await sb.from("review_drafts").select(`${DRAFT_COLS}, project_id`).eq("id", id).maybeSingle();
  check(error);
  if (!data) return null;
  return { ...toDraft(data as unknown as DraftDb), projectId: (data as { project_id: string }).project_id };
}

export async function claimReview(draftId: string): Promise<{ allowed: boolean; remaining: number | null }> {
  const [uid, pro] = await Promise.all([requireUserId(), getProStatus()]);
  const { data, error } = await createAdminClient().rpc("dp_claim_review", {
    p_user: uid,
    p_draft: draftId,
    p_cap: reviewCap(pro.plan === "unlimited"),
  });
  check(error);
  const r = data as { allowed: boolean; remaining: number | null };
  return { allowed: r.allowed, remaining: r.remaining };
}

export async function setPrioritiesDone(draftId: string, done: number[]): Promise<void> {
  const sb = await db();
  const clean = [...new Set(done.filter((n) => Number.isInteger(n) && n >= 0 && n < 10))];
  const { error } = await sb.from("review_drafts").update({ done_priorities: clean }).eq("id", draftId);
  check(error);
}

/** A short-lived link to the student's own PDF (for the viewer). */
export async function getDraftFileUrl(draftId: string): Promise<string | null> {
  const uid = await requireUserId();
  const admin = createAdminClient();
  const { data } = await admin.from("review_drafts").select("file_path").eq("id", draftId).eq("user_id", uid).maybeSingle();
  if (!data) return null;
  const signed = await admin.storage.from(BUCKET).createSignedUrl(data.file_path as string, 600);
  return signed.data?.signedUrl ?? null;
}
