"use server";

import crypto from "node:crypto";
import { createClient } from "../supabase/server";
import { checkRateLimit } from "../ratelimit";
import { requireOneOf } from "../validation";
import type { ActionResult } from "../types";
import { getCurrentUserProfile } from "../get-current-user";
import {
  parseIcsFile,
  buildExternalUid,
  truncateTitle,
  MAX_IMPORT_EVENTS,
  IMPORT_MAX_TITLE_LENGTH,
} from "../ics-import";
import { computeMySubjectIds } from "@/components/hub/onboarding/subject-cap";
import { SUBJECTS, type HubItemType, type SubjectId } from "@/components/hub/mock-data";

const SUBJECT_IDS = SUBJECTS.map((s) => s.id);
const TYPE_OPTIONS: HubItemType[] = ["ib_component", "task", "study_block", "university"];
const MAX_FILE_BYTES = 2 * 1024 * 1024;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export type ImportPreviewEvent = {
  externalUid: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  isRecurring: boolean;
  suggestedSubjectId: SubjectId | null;
  suggestedType: HubItemType;
  existsAlready: boolean;
};

export type ImportPreview = {
  events: ImportPreviewEvent[];
  newCount: number;
  updateCount: number;
  recurringGroupCount: number;
  truncated: boolean;
  skippedOwnFeedCount: number;
};

export async function parseIcsImportPreview(
  fileText: string,
  includeRecurring: boolean,
): Promise<ActionResult<ImportPreview>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to import a calendar file" };

  if (Buffer.byteLength(fileText, "utf8") > MAX_FILE_BYTES) {
    return { success: false, error: "That file is too large — the limit is 2 MB." };
  }

  const profile = await getCurrentUserProfile();
  const mySubjectIds = computeMySubjectIds((profile?.hub_subjects as SubjectId[] | null) ?? null);
  const candidateSubjects = SUBJECTS.filter((s) => mySubjectIds.has(s.id)).map((s) => s.id);

  const parsed = parseIcsFile(fileText, {
    now: new Date(),
    userSubjectIds: candidateSubjects,
    includeRecurring,
  });
  if (!parsed.success) return { success: false, error: parsed.error };

  const externalUids = parsed.events.map((e) => buildExternalUid(e.uid, e.recurrenceId));
  const { data: existingRows } = await supabase
    .from("hub_items")
    .select("external_uid")
    .eq("owner_id", user.id)
    .in("external_uid", externalUids.length > 0 ? externalUids : [""]);
  const existingSet = new Set((existingRows ?? []).map((r) => r.external_uid as string));

  const events: ImportPreviewEvent[] = parsed.events.map((e) => {
    const externalUid = buildExternalUid(e.uid, e.recurrenceId);
    return {
      externalUid,
      title: e.title,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
      allDay: e.allDay,
      isRecurring: e.isRecurring,
      suggestedSubjectId: e.suggestedSubjectId,
      suggestedType: e.suggestedType,
      existsAlready: existingSet.has(externalUid),
    };
  });

  return {
    success: true,
    data: {
      events,
      newCount: events.filter((e) => !e.existsAlready).length,
      updateCount: events.filter((e) => e.existsAlready).length,
      recurringGroupCount: parsed.recurringGroupCount,
      truncated: parsed.truncated,
      skippedOwnFeedCount: parsed.skippedOwnFeedCount,
    },
  };
}

export type ImportSelection = {
  externalUid: string;
  title: string;
  type: string;
  subjectId: string | null;
  start: string;
  end: string;
  allDay: boolean;
};

export async function confirmIcsImport(
  events: ImportSelection[],
): Promise<ActionResult<{ imported: number; batchId: string }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to import a calendar file" };
  if (events.length === 0) return { success: true, data: { imported: 0, batchId: "" } };
  if (events.length > MAX_IMPORT_EVENTS) {
    return { success: false, error: `You can import at most ${MAX_IMPORT_EVENTS} events at once.` };
  }

  const rateLimit = await checkRateLimit("write", user.id);
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const batchId = crypto.randomUUID();
  const rows = [];
  for (const event of events) {
    const typeResult = requireOneOf(event.type, "Type", TYPE_OPTIONS);
    if ("error" in typeResult) return { success: false, error: typeResult.error };
    if (event.subjectId && !SUBJECT_IDS.includes(event.subjectId as SubjectId)) {
      return { success: false, error: "Invalid subject" };
    }
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end.getTime() < start.getTime()) {
      return { success: false, error: "Invalid event time" };
    }
    if (!event.externalUid) return { success: false, error: "Invalid event" };

    rows.push({
      id: `itm-${crypto.randomUUID().slice(0, 8)}`,
      owner_id: user.id,
      title: truncateTitle(event.title.trim() || "Untitled event", IMPORT_MAX_TITLE_LENGTH),
      type: typeResult.value,
      subject_id: event.subjectId || null,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      all_day: event.allDay,
      status: "todo",
      stages: [],
      notes: "",
      resource_ids: [],
      weight_label: null,
      source: "ics_import",
      external_uid: event.externalUid,
      import_batch_id: batchId,
    });
  }

  const { error } = await supabase.from("hub_items").upsert(rows, { onConflict: "owner_id,external_uid" });
  if (error) return { success: false, error: error.message };

  return { success: true, data: { imported: rows.length, batchId } };
}

export async function undoImportBatch(batchId: string): Promise<ActionResult<{ deleted: number }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to undo an import" };
  if (!batchId) return { success: false, error: "Invalid import" };

  // Rows the user has since edited had their import_batch_id cleared (see
  // app/lib/actions/hub.ts's update actions) — this delete naturally only
  // ever touches rows still exactly as the import left them.
  const { data, error } = await supabase
    .from("hub_items")
    .delete()
    .eq("owner_id", user.id)
    .eq("import_batch_id", batchId)
    .select("id");

  if (error) return { success: false, error: error.message };
  return { success: true, data: { deleted: (data ?? []).length } };
}

export type RecentImportBatch = { batchId: string; count: number; importedAt: string };

export async function getRecentImportBatches(): Promise<ActionResult<RecentImportBatch[]>> {
  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Log in to view recent imports" };

  const { data, error } = await supabase
    .from("hub_items")
    .select("import_batch_id, created_at")
    .eq("owner_id", user.id)
    .not("import_batch_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return { success: false, error: error.message };

  const byBatch = new Map<string, { count: number; importedAt: string }>();
  for (const row of data ?? []) {
    const id = row.import_batch_id as string;
    const existing = byBatch.get(id);
    if (existing) existing.count++;
    else byBatch.set(id, { count: 1, importedAt: row.created_at as string });
  }

  const batches = [...byBatch.entries()]
    .map(([batchId, v]) => ({ batchId, count: v.count, importedAt: v.importedAt }))
    .sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime())
    .slice(0, 5);

  return { success: true, data: batches };
}
