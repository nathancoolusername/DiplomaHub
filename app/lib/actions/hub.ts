"use server";

import { createClient } from "../supabase/server";
import { checkRateLimit } from "../ratelimit";
import { requireField, requireOneOf } from "../validation";
import type { ActionResult, Resource } from "../types";
import { getResourcesPage } from "./resources";
import { hubItemToRow, rowToHubItem, type HubItemRow } from "@/components/hub/hub-row";
import {
  SUBJECTS,
  type HubItem,
  type HubItemStatus,
  type SubjectId,
  type Stage,
} from "@/components/hub/mock-data";

const SUBJECT_IDS = SUBJECTS.map((s) => s.id);
const TYPE_OPTIONS = ["ib_component", "task", "study_block", "university"];
const STATUS_OPTIONS = ["todo", "done"];

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getHubItems(): Promise<ActionResult<HubItem[]>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to load your plan" };

  const { data, error } = await supabase
    .from("hub_items")
    .select("*")
    .eq("owner_id", user.id)
    .order("start_at", { ascending: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: (data as HubItemRow[]).map(rowToHubItem) };
}

export async function getHubStudyLog(
  startDate: string,
  endDate: string,
): Promise<ActionResult<{ log_date: string; hours: number }[]>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to load your study log" };

  const { data, error } = await supabase
    .from("hub_study_log")
    .select("log_date, hours")
    .eq("owner_id", user.id)
    .gte("log_date", startDate)
    .lte("log_date", endDate);

  if (error) return { success: false, error: error.message };
  return { success: true, data: data ?? [] };
}

export async function createHubItem(item: HubItem): Promise<ActionResult<HubItem>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to save this item" };

  const rateLimit = await checkRateLimit("write", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const title = requireField(item.title, "Title", 200);
  if ("error" in title) return { success: false, error: title.error };
  const type = requireOneOf(item.type, "Type", TYPE_OPTIONS);
  if ("error" in type) return { success: false, error: type.error };
  if (item.subjectId && !SUBJECT_IDS.includes(item.subjectId)) {
    return { success: false, error: "Invalid subject" };
  }

  const row = { ...hubItemToRow(item), owner_id: user.id };
  const { data, error } = await supabase.from("hub_items").insert(row).select().single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: rowToHubItem(data as HubItemRow) };
}

export async function updateHubItemTime(
  id: string,
  start: Date,
  end: Date,
): Promise<ActionResult<null>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to save changes" };

  const rateLimit = await checkRateLimit("toggle", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const { error } = await supabase
    .from("hub_items")
    // Clearing import_batch_id on every real edit is what makes "Undo
    // import" safe to keep offering later — it only ever deletes rows the
    // user hasn't touched since the import that created/refreshed them.
    .update({ start_at: start.toISOString(), end_at: end.toISOString(), import_batch_id: null })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function updateHubItemStages(
  id: string,
  stages: Stage[],
): Promise<ActionResult<null>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to save changes" };

  const rateLimit = await checkRateLimit("toggle", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const { error } = await supabase
    .from("hub_items")
    .update({ stages, import_batch_id: null })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function updateHubItemStatus(
  id: string,
  status: HubItemStatus,
): Promise<ActionResult<null>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to save changes" };

  const statusResult = requireOneOf(status, "Status", STATUS_OPTIONS);
  if ("error" in statusResult) return { success: false, error: statusResult.error };

  const rateLimit = await checkRateLimit("toggle", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const { error } = await supabase
    .from("hub_items")
    .update({ status, import_batch_id: null })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function updateHubItemNotes(
  id: string,
  notes: string,
): Promise<ActionResult<null>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to save changes" };

  if (notes.length > 5000) {
    return { success: false, error: "Notes must be under 5000 characters" };
  }

  const rateLimit = await checkRateLimit("toggle", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const { error } = await supabase
    .from("hub_items")
    .update({ notes, import_batch_id: null })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

export async function logStudySession(
  logDate: string,
  hours: number,
): Promise<ActionResult<{ log_date: string; hours: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to log a session" };

  const rateLimit = await checkRateLimit("toggle", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const { data: existing } = await supabase
    .from("hub_study_log")
    .select("hours")
    .eq("owner_id", user.id)
    .eq("log_date", logDate)
    .maybeSingle();

  const newHours = Math.round(((existing?.hours ?? 0) + hours) * 100) / 100;

  const { data, error } = await supabase
    .from("hub_study_log")
    .upsert(
      { owner_id: user.id, log_date: logDate, hours: newHours },
      { onConflict: "owner_id,log_date" },
    )
    .select("log_date, hours")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function bulkImportHubItems(
  items: HubItem[],
): Promise<ActionResult<{ imported: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to save your plan" };
  if (items.length === 0) return { success: true, data: { imported: 0 } };

  const rows = items.map((item) => ({ ...hubItemToRow(item), owner_id: user.id }));
  const { error } = await supabase
    .from("hub_items")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });

  if (error) return { success: false, error: error.message };
  return { success: true, data: { imported: rows.length } };
}

export async function bulkImportStudyLog(
  entries: { log_date: string; hours: number }[],
): Promise<ActionResult<{ imported: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to save your study log" };
  if (entries.length === 0) return { success: true, data: { imported: 0 } };

  // Guest entries might overlap a day the account already has logged time
  // for (e.g. migrating after some real usage) — add rather than overwrite.
  const { data: existingRows } = await supabase
    .from("hub_study_log")
    .select("log_date, hours")
    .eq("owner_id", user.id)
    .in(
      "log_date",
      entries.map((e) => e.log_date),
    );
  const existingByDate = new Map((existingRows ?? []).map((r) => [r.log_date, r.hours]));

  const rows = entries.map((e) => ({
    owner_id: user.id,
    log_date: e.log_date,
    hours: Math.round(((existingByDate.get(e.log_date) ?? 0) + e.hours) * 100) / 100,
  }));

  const { error } = await supabase
    .from("hub_study_log")
    .upsert(rows, { onConflict: "owner_id,log_date" });

  if (error) return { success: false, error: error.message };
  return { success: true, data: { imported: rows.length } };
}

export async function completeHubOnboarding(
  subjectIds: SubjectId[] | null,
): Promise<ActionResult<null>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to save your picks" };

  const { error } = await supabase
    .from("users")
    .update({ hub_subjects: subjectIds, hub_onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// One getResourcesPage call per Hub subject, fetched in parallel — used by
// app/hub/page.tsx to feed the task details panel's "Recommended Resources"
// with real, subject-matched site content instead of fake mock rows. Works
// for guests too since getResourcesPage has a working logged-out branch.
export async function getHubRecommendedResources(): Promise<
  Record<SubjectId, Resource[]>
> {
  const results = await Promise.all(
    SUBJECTS.map((subject) =>
      getResourcesPage({ subject: subject.name, sort: "most_liked", pageSize: 3 }),
    ),
  );

  const bySubject = {} as Record<SubjectId, Resource[]>;
  SUBJECTS.forEach((subject, i) => {
    const result = results[i];
    bySubject[subject.id] = result.success ? result.data.items : [];
  });
  return bySubject;
}
