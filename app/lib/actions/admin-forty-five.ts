"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { isAdmin } from "../admin";
import type { ActionResult } from "../types";
import { checkBank, checkPuzzle, type CheckResult } from "@/lib/forty-five/checks";
import type { GroupSubject, SourceGroup, SourcePuzzle, SourceTrap, Subject } from "@/lib/forty-five/format";
import { LAUNCH_DATE, utcToday, addDays } from "@/lib/forty-five/dates";
import { hasMixedFinal, scheduleOrder } from "@/lib/forty-five/schedule";

// Admin → Forty-Five (migration 34). The puzzle tables are service-role only,
// so everything here runs on the admin client after the admin check.

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.id)) return null;
  return createAdminClient();
}

export type FortyFiveStatus = "draft" | "approved" | "rejected";

export type AdminFortyFivePuzzle = {
  id: string;
  slug: string;
  mode: "daily" | "subject";
  subject: Subject | null;
  status: FortyFiveStatus;
  scheduledFor: string | null;
  number: number | null;
  reviewNote: string | null;
  traps: SourceTrap[];
  groups: SourceGroup[];
  check: CheckResult;
  /** Scheduled for today or earlier: players have seen it, so it can't be edited or pulled. */
  live: boolean;
};

export type FortyFiveAdminData = {
  puzzles: AdminFortyFivePuzzle[];
  today: string;
  counts: Record<FortyFiveStatus, number> & { scheduled: number; readyToSchedule: number };
  /** Last scheduled date, or null. */
  scheduledUntil: string | null;
};

type PuzzleRow = {
  id: string;
  slug: string;
  mode: "daily" | "subject";
  subject: Subject | null;
  status: FortyFiveStatus;
  scheduled_for: string | null;
  number: number | null;
  review_note: string | null;
  traps: SourceTrap[];
  forty_five_groups: { difficulty: 1 | 2 | 3 | 4; label: string; subject: GroupSubject; words: string[]; explanation: string }[];
};

function toSource(r: PuzzleRow): SourcePuzzle {
  const groups = [...r.forty_five_groups].sort((a, b) => a.difficulty - b.difficulty);
  return {
    slug: r.slug,
    mode: r.mode,
    subject: r.subject,
    traps: r.traps ?? [],
    groups: groups.map((g) => ({ ...g, words: g.words as SourceGroup["words"] })) as SourcePuzzle["groups"],
  };
}

export async function getFortyFiveAdminData(): Promise<ActionResult<FortyFiveAdminData>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const { data, error } = await admin
    .from("forty_five_puzzles")
    .select("id, slug, mode, subject, status, scheduled_for, number, review_note, traps, forty_five_groups (difficulty, label, subject, words, explanation)")
    .order("slug");
  if (error) return { success: false, error: error.message };

  const rows = (data ?? []) as unknown as PuzzleRow[];
  const sources = rows.map(toSource);
  const checks = checkBank(sources);
  const today = utcToday();
  const puzzles: AdminFortyFivePuzzle[] = rows.map((r, i) => ({
    id: r.id,
    slug: r.slug,
    mode: r.mode,
    subject: r.subject,
    status: r.status,
    scheduledFor: r.scheduled_for,
    number: r.number,
    reviewNote: r.review_note,
    traps: r.traps ?? [],
    groups: sources[i].groups,
    check: checks.get(r.slug) ?? { errors: [], warnings: [] },
    live: !!r.scheduled_for && r.scheduled_for <= today,
  }));
  const count = (s: FortyFiveStatus) => puzzles.filter((p) => p.status === s).length;
  const scheduled = puzzles.filter((p) => p.scheduledFor).map((p) => p.scheduledFor!).sort();
  return {
    success: true,
    data: {
      puzzles,
      today,
      counts: {
        draft: count("draft"),
        approved: count("approved"),
        rejected: count("rejected"),
        scheduled: scheduled.length,
        readyToSchedule: puzzles.filter((p) => p.status === "approved" && p.mode === "daily" && !p.scheduledFor && !p.check.errors.length).length,
      },
      scheduledUntil: scheduled.at(-1) ?? null,
    },
  };
}

async function loadOne(admin: ReturnType<typeof createAdminClient>, id: string) {
  const { data, error } = await admin
    .from("forty_five_puzzles")
    .select("id, slug, mode, subject, status, scheduled_for, number, review_note, traps, forty_five_groups (difficulty, label, subject, words, explanation)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as PuzzleRow | null;
}

/** Approve, reject or send back to draft. Approving needs zero validator errors. */
export async function reviewFortyFive(id: string, status: FortyFiveStatus, note?: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const row = await loadOne(admin, id);
  if (!row) return { success: false, error: "Puzzle not found" };
  if (row.scheduled_for && row.scheduled_for <= utcToday()) return { success: false, error: "This puzzle has already been played, so it can't change status." };
  if (status === "approved") {
    const { errors } = checkPuzzle(toSource(row));
    if (errors.length) return { success: false, error: `Fix these first: ${errors.join("; ")}` };
  }
  const { error } = await admin
    .from("forty_five_puzzles")
    .update({
      status,
      // Only approved puzzles stay on the calendar.
      ...(status === "approved" ? {} : { scheduled_for: null }),
      review_note: note?.trim() ? note.trim().slice(0, 2000) : row.review_note,
      reviewed_at: status === "draft" ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/forty-five");
  return { success: true, data: null };
}

/** Inline edit: replaces the four groups. Refused if the result has validator errors or the puzzle is live. */
export async function saveFortyFiveGroups(id: string, groups: SourceGroup[]): Promise<ActionResult<CheckResult>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const row = await loadOne(admin, id);
  if (!row) return { success: false, error: "Puzzle not found" };
  if (row.scheduled_for && row.scheduled_for <= utcToday()) return { success: false, error: "This puzzle has already been played, so it can't be edited." };

  const cleaned = groups.map((g) => ({
    difficulty: Number(g.difficulty) as SourceGroup["difficulty"],
    label: String(g.label ?? "").trim(),
    subject: g.subject,
    words: (g.words ?? []).map((w) => String(w ?? "").trim()) as SourceGroup["words"],
    explanation: String(g.explanation ?? "").trim(),
  }));
  const next: SourcePuzzle = { ...toSource(row), groups: cleaned as SourcePuzzle["groups"] };
  const check = checkPuzzle(next);
  if (check.errors.length) return { success: false, error: check.errors.join("; ") };

  const del = await admin.from("forty_five_groups").delete().eq("puzzle_id", id);
  if (del.error) return { success: false, error: del.error.message };
  const ins = await admin.from("forty_five_groups").insert(cleaned.map((g) => ({ ...g, puzzle_id: id })));
  if (ins.error) return { success: false, error: `${ins.error.message} (groups were cleared; save again)` };
  await admin.from("forty_five_puzzles").update({ updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/forty-five");
  return { success: true, data: check };
}

/**
 * Puts every approved, unscheduled daily puzzle on the next
 * free dates, from today (or launch day, if later), in scheduleOrder():
 * d-001 first, then 4 Mixed-final puzzles per other one. The number follows from
 * the date (migration 34: 2026-11-10 is #1). Puzzles with errors are skipped.
 */
export async function scheduleFortyFive(): Promise<ActionResult<{ scheduled: number; from: string | null; to: string | null }>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const { data, error } = await admin
    .from("forty_five_puzzles")
    .select("id, slug, mode, subject, status, scheduled_for, number, review_note, traps, forty_five_groups (difficulty, label, subject, words, explanation)")
    .eq("mode", "daily")
    .order("slug");
  if (error) return { success: false, error: error.message };
  const rows = (data ?? []) as unknown as PuzzleRow[];

  const taken = new Set(rows.map((r) => r.scheduled_for).filter(Boolean) as string[]);
  const queue = scheduleOrder(
    rows
      .filter((r) => r.status === "approved" && !r.scheduled_for && !checkPuzzle(toSource(r)).errors.length)
      .map((r) => ({ ...r, mixedFinal: hasMixedFinal(r.forty_five_groups) })),
  );
  const today = utcToday();
  let day = today > LAUNCH_DATE ? today : LAUNCH_DATE;
  const done: string[] = [];
  for (const r of queue) {
    while (taken.has(day)) day = addDays(day, 1);
    // Guard on scheduled_for still being empty, in case another tab scheduled it.
    const up = await admin.from("forty_five_puzzles").update({ scheduled_for: day, updated_at: new Date().toISOString() }).eq("id", r.id).is("scheduled_for", null).eq("status", "approved");
    if (up.error) return { success: false, error: `${r.slug}: ${up.error.message} (${done.length} scheduled before this)` };
    taken.add(day);
    done.push(day);
  }
  revalidatePath("/admin/forty-five");
  return { success: true, data: { scheduled: done.length, from: done[0] ?? null, to: done.at(-1) ?? null } };
}

/** Takes a future puzzle off the calendar (it stays approved). */
export async function unscheduleFortyFive(id: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const row = await loadOne(admin, id);
  if (!row?.scheduled_for) return { success: false, error: "Not scheduled" };
  if (row.scheduled_for <= utcToday()) return { success: false, error: "Today's and past puzzles stay on the calendar." };
  const { error } = await admin.from("forty_five_puzzles").update({ scheduled_for: null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/forty-five");
  return { success: true, data: null };
}
