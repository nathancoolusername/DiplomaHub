"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";
import { isAdmin } from "../admin";
import type { ActionResult } from "../types";
import { type BankFile, type DbPrompt, type ImportDiff, diffImport, groupAnswers, toPayload, validate } from "@/lib/deadline/bank";
import { squash } from "@/lib/deadline/normalize";

// Admin → Deadline (migration 56). The bank tables are service-role only, so
// everything here runs on the admin client after the admin check. The bank
// lives in the database and is edited here; the old content/deadline files
// can be uploaded once (or again, in bulk) to load it.

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdmin(user?.id)) return null;
  return createAdminClient();
}

/** The whole bank as the database holds it (answers paged: the API returns 1,000 rows at a time). */
async function readBank(admin: SupabaseClient): Promise<DbPrompt[]> {
  const prompts = await admin.from("dl_prompts").select("id, slug, subject, text, fuzzy, deny, active, file, position, extra").order("slug");
  if (prompts.error) throw new Error(/does not exist|schema cache/i.test(prompts.error.message) ? "Run migration 56 (Deadline) first." : prompts.error.message);
  const rows: Parameters<typeof groupAnswers>[0] = [];
  for (let from = 0; ; from += 1000) {
    const page = await admin.from("dl_prompt_answers").select("prompt_id, canonical, rarity, aliases, exact_only, position")
      .order("id").range(from, from + 999);
    if (page.error) throw new Error(page.error.message);
    rows.push(...page.data);
    if (page.data.length < 1000) break;
  }
  const answers = groupAnswers(rows);
  return prompts.data.map((p) => ({
    slug: p.slug, subject: p.subject, text: p.text, fuzzy: p.fuzzy, deny: p.deny ?? [], active: p.active,
    file: p.file, position: p.position, extra: p.extra ?? {}, answers: answers.get(p.id) ?? [],
  }));
}

/** One prompt (with its id) as the database holds it. */
async function readPrompt(admin: SupabaseClient, by: { slug?: string; id?: string }): Promise<(DbPrompt & { id: string }) | null> {
  const q = admin.from("dl_prompts").select("id, slug, subject, text, fuzzy, deny, active, file, position, extra");
  const p = await (by.id ? q.eq("id", by.id) : q.eq("slug", by.slug ?? "")).maybeSingle();
  if (p.error) throw new Error(p.error.message);
  if (!p.data) return null;
  const a = await admin.from("dl_prompt_answers").select("prompt_id, canonical, rarity, aliases, exact_only, position").eq("prompt_id", p.data.id);
  if (a.error) throw new Error(a.error.message);
  const d = p.data;
  return { id: d.id, slug: d.slug, subject: d.subject, text: d.text, fuzzy: d.fuzzy, deny: d.deny ?? [], active: d.active,
    file: d.file, position: d.position, extra: d.extra ?? {}, answers: groupAnswers(a.data).get(d.id) ?? [] };
}

/**
 * Saves one prompt through dl_import_bank (same checks as an import; answer
 * ids and stats kept; only changed spellings rebuilt). A switched-off prompt
 * stays off. Returns the clash warnings.
 */
async function savePrompt(admin: SupabaseClient, p: DbPrompt): Promise<{ warnings: string[] } | { error: string }> {
  const file = { file: p.file ?? "admin.json", prompts: [{ ...p.extra, slug: p.slug, subject: p.subject, text: p.text, fuzzy: p.fuzzy, deny: p.deny, answers: p.answers }] };
  const problems = validate([file]);
  if (problems.length) return { error: problems[0].replace(/^[^·]*· /, "") };
  const [payload] = toPayload([file]);
  const res = await admin.rpc("dl_import_bank", { p_prompts: [{ ...payload, file: p.file, position: p.position }], p_retire_missing: false });
  if (res.error) return { error: res.error.message };
  if (p.active === false) await admin.from("dl_prompts").update({ active: false }).eq("slug", p.slug);
  return { warnings: (res.data as { warnings: string[] }).warnings };
}

function withoutId(p: DbPrompt & { id: string }): DbPrompt {
  return { slug: p.slug, subject: p.subject, text: p.text, fuzzy: p.fuzzy, deny: p.deny, active: p.active, file: p.file, position: p.position, extra: p.extra, answers: p.answers };
}

/** Uploaded files, checked for shape before anything else looks at them. */
function cleanUpload(files: unknown): { files: BankFile[] } | { error: string } {
  if (!Array.isArray(files) || !files.length) return { error: "Choose the .json files from content/deadline." };
  const out: BankFile[] = [];
  for (const f of files) {
    const name = (f as BankFile)?.file;
    if (typeof name !== "string" || !/^[\w.-]{1,80}\.json$/.test(name)) return { error: `"${String(name).slice(0, 80)}" isn't a bank file name.` };
    if (out.some((o) => o.file === name)) return { error: `${name} was added twice.` };
    out.push({ file: name, prompts: (f as BankFile).prompts });
  }
  return { files: out };
}

export type DeadlinePreview = { problems: string[]; diff: ImportDiff | null; files: number };

/** What importing these files would change. Nothing is written. */
export async function previewDeadlineImport(files: unknown, retireMissing: boolean): Promise<ActionResult<DeadlinePreview>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const up = cleanUpload(files);
  if ("error" in up) return { success: false, error: up.error };
  const problems = validate(up.files);
  if (problems.length) return { success: true, data: { problems, diff: null, files: up.files.length } };
  try {
    return { success: true, data: { problems: [], diff: diffImport(up.files, await readBank(admin), retireMissing), files: up.files.length } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export type DeadlineImportResult = {
  sent: number;
  prompts_new: number;
  prompts_changed: number;
  answers_added: number;
  answers_changed: number;
  answers_removed: number;
  prompts_retired: number;
  warnings: string[];
};

/**
 * Imports the files: only new or changed prompts, 20 per database call (each
 * call all-or-nothing, so a retry after a failure is always safe). Prompts
 * match by slug and answers by name, so stats survive; removed answers keep
 * their play history; prompts missing from the files are switched off.
 */
export async function importDeadlineBank(files: unknown, retireMissing: boolean): Promise<ActionResult<DeadlineImportResult>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const up = cleanUpload(files);
  if ("error" in up) return { success: false, error: up.error };
  const problems = validate(up.files);
  if (problems.length) return { success: false, error: `The files have ${problems.length} problem(s); nothing was imported. ${problems[0]}` };
  try {
    const diff = diffImport(up.files, await readBank(admin), retireMissing);
    const payload = toPayload(up.files);
    const send = payload.filter((p) => diff.touched.includes(p.slug));
    const allSlugs = payload.map((p) => p.slug);
    const total: DeadlineImportResult = { sent: send.length, prompts_new: 0, prompts_changed: 0, answers_added: 0, answers_changed: 0, answers_removed: 0, prompts_retired: 0, warnings: [] };
    const batches = send.length ? Array.from({ length: Math.ceil(send.length / 20) }, (_, i) => send.slice(i * 20, i * 20 + 20)) : [[]];
    for (const [i, batch] of batches.entries()) {
      const res = await admin.rpc("dl_import_bank", { p_prompts: batch, p_retire_missing: retireMissing, p_all_slugs: allSlugs });
      if (res.error) {
        revalidatePath("/admin/deadline");
        return {
          success: false,
          error: `Import stopped at batch ${i + 1} of ${batches.length}${i ? " (the earlier batches are in; import again to finish)" : "; nothing was changed"}: ${res.error.message}`,
        };
      }
      const r = res.data as Omit<DeadlineImportResult, "sent">;
      total.prompts_new += r.prompts_new;
      total.prompts_changed += r.prompts_changed;
      total.answers_added += r.answers_added;
      total.answers_changed += r.answers_changed;
      total.answers_removed += r.answers_removed;
      total.prompts_retired += r.prompts_retired;
      total.warnings.push(...r.warnings);
    }
    revalidatePath("/admin/deadline");
    return { success: true, data: total };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** The whole bank, for the editor. */
export async function getDeadlineBank(): Promise<ActionResult<DbPrompt[]>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  try {
    return { success: true, data: await readBank(admin) };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export type DeadlinePromptEdit = DbPrompt;

/**
 * Saves one prompt from the editor (new or existing) through dl_import_bank,
 * so it gets the same checks, keeps answer ids and stats, and rebuilds only
 * the spellings that changed. Returns the saved prompt and any clash warnings.
 */
export async function saveDeadlinePrompt(p: DeadlinePromptEdit): Promise<ActionResult<{ prompt: DbPrompt; warnings: string[] }>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(p?.slug ?? "")) return { success: false, error: "The slug needs lower-case letters, digits and dashes (e.g. bio-organelle)." };
  const r = await savePrompt(admin, p);
  if ("error" in r) return { success: false, error: r.error };
  try {
    const saved = await readPrompt(admin, { slug: p.slug });
    if (!saved) return { success: false, error: "Saved, but couldn't read it back." };
    revalidatePath("/admin/deadline");
    return { success: true, data: { prompt: withoutId(saved), warnings: r.warnings } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** Switch a prompt off (out of new games; its history stays) or back on. */
export async function setDeadlinePromptActive(slug: string, active: boolean): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const { error } = await admin.from("dl_prompts").update({ active }).eq("slug", slug);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/deadline");
  return { success: true, data: null };
}

export type DeadlineTry = { result: "exact" | "typo" | "sound" | "prefix" | "wrong" | "ambiguous" | "denied"; answer?: string };

/** Runs the game's own matcher on the saved prompt: what would happen if a player typed this. */
export async function tryDeadlineAnswer(slug: string, text: string): Promise<ActionResult<DeadlineTry>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  const prompt = await admin.from("dl_prompts").select("id").eq("slug", slug).maybeSingle();
  if (prompt.error || !prompt.data) return { success: false, error: prompt.error?.message ?? "Save the prompt first." };
  const m = await admin.rpc("dl_match", { p_prompt: prompt.data.id, p_text: text });
  if (m.error) return { success: false, error: m.error.message };
  const r = m.data as { answer_id?: string; matched_by?: DeadlineTry["result"]; reason?: DeadlineTry["result"] };
  if (!r.answer_id) return { success: true, data: { result: r.reason ?? "wrong" } };
  const a = await admin.from("dl_prompt_answers").select("canonical").eq("id", r.answer_id).single();
  return { success: true, data: { result: r.matched_by ?? "exact", answer: a.data?.canonical } };
}

// ── Missing answers (rejects), typo accepts, chat reports ──────────────────

export type MissingFix =
  | { kind: "answer"; text: string; rarity: number }
  | { kind: "alias"; text: string; answer: string }
  | { kind: "deny"; text: string }
  | { kind: "ignore" };

/**
 * A rejected answer from the queue: add it as a new answer, as another
 * spelling of an answer, or to the deny list (all saved like an editor save,
 * live for the next prompt), or ignore it. Every reject typed the same way on
 * that prompt is marked done.
 */
export async function resolveMissingAnswer(slug: string, norm: string, fix: MissingFix): Promise<ActionResult<{ warnings: string[] }>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  try {
    const p = await readPrompt(admin, { slug });
    if (!p) return { success: false, error: "That prompt is gone." };
    let warnings: string[] = [];
    if (fix.kind !== "ignore") {
      const text = fix.text.trim().slice(0, 120);
      if (!text) return { success: false, error: "Type the answer first." };
      if (fix.kind === "answer") {
        if (!(fix.rarity >= 1 && fix.rarity <= 7)) return { success: false, error: "Pick a rarity from 1 to 7." };
        if (p.answers.some((a) => a[0].toLowerCase() === text.toLowerCase())) return { success: false, error: `"${text}" is already an answer.` };
        p.answers.push([text, fix.rarity]);
      } else if (fix.kind === "alias") {
        const a = p.answers.find((x) => x[0] === fix.answer);
        if (!a) return { success: false, error: "Pick which answer it's a spelling of." };
        a[2] = [...(a[2] ?? []), text];
      } else {
        if (!p.deny.includes(text)) p.deny.push(text);
      }
      const r = await savePrompt(admin, p);
      if ("error" in r) return { success: false, error: r.error };
      warnings = r.warnings;
    }
    const status = fix.kind === "ignore" ? "ignored" : fix.kind === "deny" ? "denied" : "accepted";
    const u = await admin.from("dl_answer_rejects").update({ status }).eq("prompt_id", p.id).eq("norm_text", norm).eq("status", "new");
    if (u.error) return { success: false, error: u.error.message };
    revalidatePath("/admin/deadline", "layout");
    return { success: true, data: { warnings } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * An answer accepted only as a typo / sound-alike / first word: keep it as a
 * proper spelling of that answer, deny it from now on, or mark it fine (it
 * stops showing here; the game keeps accepting it).
 */
export async function resolveTypoAccept(slug: string, raw: string, answer: string, kind: "alias" | "deny" | "ok"): Promise<ActionResult<{ warnings: string[] }>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  try {
    const p = await readPrompt(admin, { slug });
    if (!p) return { success: false, error: "That prompt is gone." };
    const text = raw.trim().slice(0, 120);
    if (kind === "alias") {
      const a = p.answers.find((x) => x[0] === answer);
      if (!a) return { success: false, error: `"${answer}" isn't an answer any more.` };
      a[2] = [...(a[2] ?? []), text];
    } else if (kind === "deny") {
      if (!p.deny.includes(text)) p.deny.push(text);
    } else {
      const ok = Array.isArray(p.extra.typo_ok) ? (p.extra.typo_ok as string[]) : [];
      p.extra = { ...p.extra, typo_ok: [...new Set([...ok, squash(text)])] };
    }
    const r = await savePrompt(admin, p);
    if ("error" in r) return { success: false, error: r.error };
    revalidatePath("/admin/deadline", "layout");
    return { success: true, data: { warnings: r.warnings } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/** A reported chat message: hide it for everyone (if its room still exists), or dismiss the reports. */
export async function resolveReport(messageId: string, kind: "hide" | "dismiss"): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Not authorised" };
  if (kind === "hide") {
    const m = await admin.from("dl_room_messages").update({ hidden: true }).eq("id", messageId).select("room_id").maybeSingle();
    if (m.error) return { success: false, error: m.error.message };
    if (m.data) await admin.rpc("dl_send", { p_room: m.data.room_id, p_event: "hide", p_payload: { id: messageId } });
  }
  const d = await admin.from("dl_message_reports").delete().eq("message_id", messageId);
  if (d.error) return { success: false, error: d.error.message };
  revalidatePath("/admin/deadline", "layout");
  return { success: true, data: null };
}
