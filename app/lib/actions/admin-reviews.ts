"use server";

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { isAdmin } from "../admin";
import type { TokenTotals } from "@/lib/bro/pricing";
import { KIND_LABELS, REVIEWS_PER_MONTH, type ReviewKind } from "@/lib/review/labels";
import { subjectById } from "@/lib/catalog";
import type { ActionResult } from "../types";

// Admin → Reviews: how coursework reviews are used, what they cost, how long
// they take and who uses up the monthly allowance (migration 65). Service-role
// client after the admin check. Students' work and reports stay private: only
// counts, totals and timings are shown.

export type ReviewRow = {
  id: string;
  at: string;
  name: string;
  work: string;
  status: string;
  seconds: number | null;
  tokens: TokenTotals;
  mark: string | null;
  error: string | null;
};

export type ReviewAdminData = {
  window: { uploads: number; started: number; done: number; failed: number; students: number; tokens: TokenTotals[]; avgSeconds: number | null };
  month: { reviews: number; refunded: number; students: number; capHits: { name: string; used: number }[]; tokens: TokenTotals[] };
  total: { projects: number; reviews: number };
  byType: { label: string; value: number }[];
  recent: ReviewRow[];
};

type DraftRow = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  claimed_at: string | null;
  finished_at: string | null;
  error: string | null;
  model: string | null;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  report: { criteria?: { mark_low: number; mark_high: number; not_assessed?: boolean }[] } | null;
  review_projects: { kind: ReviewKind; subject_id: string | null } | null;
  user: { display_name: string | null } | null;
};

const tokensOf = (d: DraftRow): TokenTotals => ({
  model: d.model ?? "claude-opus-5-5",
  input: d.input_tokens,
  output: d.output_tokens,
  cache_read: d.cache_read_tokens,
  cache_write: d.cache_write_tokens,
});

const workLabel = (p: DraftRow["review_projects"]) => {
  if (!p) return "Coursework";
  const subject = p.subject_id ? subjectById(p.subject_id as Parameters<typeof subjectById>[0])?.shortName ?? p.subject_id : null;
  return subject ? `${subject} ${p.kind === "ia" ? "IA" : p.kind === "ee" ? "EE" : KIND_LABELS[p.kind]}` : KIND_LABELS[p.kind];
};

export async function getReviewAdminData(days: number): Promise<ActionResult<ReviewAdminData>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.id)) return { success: false, error: "Not allowed" };
  const admin = createAdminClient();

  const now = new Date();
  const since = new Date(now.getTime() - days * 86_400_000).toISOString();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const from = since < monthStart ? since : monthStart;

  const [draftsRes, claimsRes, projectsRes, reviewsRes] = await Promise.all([
    admin
      .from("review_drafts")
      .select(
        "id, user_id, status, created_at, claimed_at, finished_at, error, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, report, review_projects(kind, subject_id), user:users!review_drafts_user_id_fkey(display_name)",
      )
      .gte("created_at", from)
      .order("created_at", { ascending: false })
      .limit(2000),
    admin.from("review_claims").select("user_id, refunded, user:users!review_claims_user_id_fkey(display_name)").gte("claimed_at", monthStart).limit(5000),
    admin.from("review_projects").select("id", { count: "exact", head: true }),
    admin.from("review_drafts").select("id", { count: "exact", head: true }).eq("status", "done"),
  ]);
  const err = draftsRes.error ?? claimsRes.error ?? projectsRes.error ?? reviewsRes.error;
  if (err) return { success: false, error: err.message };

  const drafts = (draftsRes.data ?? []) as unknown as DraftRow[];
  const inWindow = drafts.filter((d) => d.created_at >= since);
  const reviewed = inWindow.filter((d) => d.claimed_at && d.claimed_at >= since);
  const done = reviewed.filter((d) => d.status === "done");
  const durations = done.filter((d) => d.finished_at && d.claimed_at).map((d) => (Date.parse(d.finished_at!) - Date.parse(d.claimed_at!)) / 1000);

  const claims = (claimsRes.data ?? []) as unknown as { user_id: string; refunded: boolean; user: { display_name: string | null } | null }[];
  const counted = claims.filter((c) => !c.refunded);
  const perUser = new Map<string, { name: string; used: number }>();
  for (const c of counted) {
    const u = perUser.get(c.user_id) ?? { name: c.user?.display_name || "Student", used: 0 };
    u.used++;
    perUser.set(c.user_id, u);
  }

  const typeCounts = new Map<string, number>();
  for (const d of done) typeCounts.set(workLabel(d.review_projects), (typeCounts.get(workLabel(d.review_projects)) ?? 0) + 1);

  return {
    success: true,
    data: {
      window: {
        uploads: inWindow.length,
        started: reviewed.length,
        done: done.length,
        failed: reviewed.filter((d) => d.status === "failed").length,
        students: new Set(reviewed.map((d) => d.user_id)).size,
        tokens: inWindow.map(tokensOf),
        avgSeconds: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
      },
      month: {
        reviews: counted.length,
        refunded: claims.length - counted.length,
        students: perUser.size,
        capHits: [...perUser.values()].filter((u) => u.used >= REVIEWS_PER_MONTH).sort((a, b) => b.used - a.used),
        tokens: drafts.filter((d) => d.created_at >= monthStart).map(tokensOf),
      },
      total: { projects: projectsRes.count ?? 0, reviews: reviewsRes.count ?? 0 },
      byType: [...typeCounts.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
      recent: drafts.slice(0, 25).map((d) => {
        const assessed = d.report?.criteria?.filter((c) => !c.not_assessed) ?? [];
        const lo = assessed.reduce((n, c) => n + c.mark_low, 0);
        const hi = assessed.reduce((n, c) => n + c.mark_high, 0);
        return {
          id: d.id,
          at: d.claimed_at ?? d.created_at,
          name: d.user?.display_name || "Student",
          work: workLabel(d.review_projects),
          status: d.status,
          seconds: d.finished_at && d.claimed_at ? Math.round((Date.parse(d.finished_at) - Date.parse(d.claimed_at)) / 1000) : null,
          tokens: tokensOf(d),
          mark: assessed.length ? (lo === hi ? `${lo}` : `${lo}–${hi}`) : null,
          error: d.error,
        };
      }),
    },
  };
}
