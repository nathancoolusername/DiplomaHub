"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "../supabase/admin";
import { getCurrentUserId } from "../get-current-user";
import { createClient } from "../supabase/server";
import { addHubItems, createHubSetCode } from "@/lib/data";
import { createHubSet, shareHubSet } from "./hub-sets";
import { readCards, type HubCard, type HubCardItem, type HubChangesCard, type RedeemCard, type SettingsCard } from "@/lib/bro/cards";
import { addExtraClass, getUserSubjects, redeemCode, removeExtraClass, setCoreSubjects, setExamSession, setProBadgeHidden, setSubjectLevel, setThemePreference } from "@/lib/data";
import { redeemedText } from "@/lib/bro/redeem";
import type { ActionResult } from "../types";

// "Add to Hub" on a card Bro proposed. Adds exactly the items stored on the
// card in that (the student's own) message, never anything sent from the
// browser, then marks the card added so it can't be added twice.

export async function addBroHubCard(messageId: number, index: number): Promise<ActionResult<HubCard>> {
  const uid = await getCurrentUserId();
  if (!uid) return { success: false, error: "Sign in first." };
  if (!Number.isSafeInteger(messageId) || !Number.isInteger(index) || index < 0 || index > 5) return { success: false, error: "Bad request." };

  // RLS: only their own message comes back.
  const { data: msg } = await (await createClient())
    .from("bro_messages")
    .select("id, attachments")
    .eq("id", messageId)
    .eq("user_id", uid)
    .eq("role", "assistant")
    .maybeSingle();
  if (!msg) return { success: false, error: "That card is gone." };
  const cards = readCards(msg.attachments);
  const card = cards[index];
  if (!card || card.type !== "hub") return { success: false, error: "That card is gone." };
  if (card.status === "added") return { success: true, data: card };

  const ids = await addHubItems(card.items);
  // A named plan becomes a Hub set the student keeps (shown under Sets, shareable from there too).
  const set = card.title && ids.length > 1 ? await createHubSet(card.title, ids, "bro") : null;
  const added: HubCard = { ...card, status: "added", addedIds: ids, setId: set?.success ? set.data.id : null };
  const next = cards.map((c, i) => (i === index ? added : c));
  const { error } = await createAdminClient().from("bro_messages").update({ attachments: next }).eq("id", messageId).eq("user_id", uid);
  if (error) return { success: false, error: "Added, but couldn't update the card." };
  revalidatePath("/hub");
  revalidatePath("/");
  return { success: true, data: added };
}

/**
 * "Get a share code" on a plan Bro made, once it's in the Hub: a Hub set code
 * (create_hub_set_code, migration 32) for the items that card added, named
 * after the plan. Made once; the card keeps the code.
 */
export async function shareBroHubCard(messageId: number, index: number): Promise<ActionResult<HubCard>> {
  const uid = await getCurrentUserId();
  if (!uid) return { success: false, error: "Sign in first." };
  if (!Number.isSafeInteger(messageId) || !Number.isInteger(index) || index < 0 || index > 5) return { success: false, error: "Bad request." };
  const { data: msg } = await (await createClient())
    .from("bro_messages")
    .select("id, attachments")
    .eq("id", messageId)
    .eq("user_id", uid)
    .eq("role", "assistant")
    .maybeSingle();
  if (!msg) return { success: false, error: "That card is gone." };
  const cards = readCards(msg.attachments);
  const card = cards[index];
  if (!card || card.type !== "hub") return { success: false, error: "That card is gone." };
  if (card.code) return { success: true, data: card };
  if (card.status !== "added" || !card.addedIds?.length) return { success: false, error: "Add it to your Hub first." };

  let code: string;
  try {
    if (card.setId) {
      // The set as it is now in their Hub (they may have moved things since).
      const r = await shareHubSet(card.setId);
      if (!r.success) return { success: false, error: r.error };
      code = r.data.code;
    } else {
      code = (await createHubSetCode(card.title || "Study plan", card.addedIds)).code;
    }
  } catch (e) {
    const gone = e instanceof Error && /not found/i.test(e.message);
    return { success: false, error: gone ? "Some of these items changed in your Hub. Share them from the Hub instead." : "Couldn't make a code. Try again?" };
  }
  const shared: HubCard = { ...card, code };
  const next = cards.map((c, i) => (i === index ? shared : c));
  await createAdminClient().from("bro_messages").update({ attachments: next }).eq("id", messageId).eq("user_id", uid);
  revalidatePath("/codes");
  return { success: true, data: shared };
}

/**
 * Editing a proposed Hub card before it's added: the student changes titles,
 * dates, times or kinds, or removes items. The edited list replaces the
 * stored one (checked here), so "Add to Hub" adds exactly what they see.
 * Subjects can't be changed to anything that wasn't on the card.
 */
export async function editBroHubCard(messageId: number, index: number, items: HubCardItem[]): Promise<ActionResult<HubCard>> {
  const uid = await getCurrentUserId();
  if (!uid) return { success: false, error: "Sign in first." };
  if (!Number.isSafeInteger(messageId) || !Number.isInteger(index) || index < 0 || index > 5) return { success: false, error: "Bad request." };
  if (!Array.isArray(items) || items.length === 0) return { success: false, error: "Keep at least one item." };
  if (items.length > 12) return { success: false, error: "That's too many items for one card." };

  const { data: msg } = await (await createClient())
    .from("bro_messages")
    .select("id, attachments")
    .eq("id", messageId)
    .eq("user_id", uid)
    .eq("role", "assistant")
    .maybeSingle();
  if (!msg) return { success: false, error: "That card is gone." };
  const cards = readCards(msg.attachments);
  const card = cards[index];
  if (!card || card.type !== "hub") return { success: false, error: "That card is gone." };
  if (card.status === "added") return { success: false, error: "It's already in your Hub: edit it there." };

  const subjects = new Map(card.items.filter((i) => i.subjectId).map((i) => [i.subjectId as string, i.subjectName]));
  const sets = new Map(card.items.filter((i) => i.practiceSetId).map((i) => [i.practiceSetId as string, i.practiceSetTitle ?? null]));
  const clean: HubCardItem[] = [];
  for (const it of items) {
    const title = typeof it?.title === "string" ? it.title.replace(/\s+/g, " ").trim().slice(0, 80) : "";
    const kind = (["test", "mock", "deadline", "study"] as const).includes(it?.kind) ? it.kind : null;
    const start = Date.parse(it?.start);
    const end = Date.parse(it?.end);
    if (!title) return { success: false, error: "Every item needs a name." };
    if (!kind || Number.isNaN(start) || Number.isNaN(end) || end <= start) return { success: false, error: "Check the dates and times." };
    if (start < Date.now() - 2 * 86_400_000 || start > Date.now() + 400 * 86_400_000) return { success: false, error: "Pick a date from today on." };
    if (end - start > 24 * 3_600_000) return { success: false, error: "An item can't be longer than a day." };
    const subjectId = typeof it.subjectId === "string" && subjects.has(it.subjectId) ? it.subjectId : null;
    // A set link stays only if Bro put it on this card.
    const setId = typeof it.practiceSetId === "string" && sets.has(it.practiceSetId) ? it.practiceSetId : null;
    clean.push({
      title,
      kind: setId ? "study" : kind,
      subjectId,
      subjectName: subjectId ? (subjects.get(subjectId) ?? null) : null,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      allDay: setId ? false : !!it.allDay,
      ...(setId ? { practiceSetId: setId, practiceSetTitle: sets.get(setId) ?? null } : {}),
    });
  }
  clean.sort((a, b) => a.start.localeCompare(b.start));
  const edited: HubCard = { ...card, items: clean };
  const next = cards.map((c, i) => (i === index ? edited : c));
  const { error } = await createAdminClient().from("bro_messages").update({ attachments: next }).eq("id", messageId).eq("user_id", uid);
  if (error) return { success: false, error: "Couldn't save that. Try again?" };
  return { success: true, data: edited };
}

/**
 * "Apply changes" on a card of edits/deletions Bro proposed. Applies exactly
 * what's stored on the card (never anything from the browser), only to the
 * student's own items and sets (RLS plus owner_id), then marks it applied.
 */
export async function applyBroChangesCard(messageId: number, index: number): Promise<ActionResult<HubChangesCard>> {
  return settleChangesCard(messageId, index, true);
}

/** "Cancel" on a card of changes: nothing changes; the card says so. */
export async function cancelBroChangesCard(messageId: number, index: number): Promise<ActionResult<HubChangesCard>> {
  return settleChangesCard(messageId, index, false);
}

async function settleChangesCard(messageId: number, index: number, apply: boolean): Promise<ActionResult<HubChangesCard>> {
  const uid = await getCurrentUserId();
  if (!uid) return { success: false, error: "Sign in first." };
  if (!Number.isSafeInteger(messageId) || !Number.isInteger(index) || index < 0 || index > 5) return { success: false, error: "Bad request." };
  const supabase = await createClient();
  const { data: msg } = await supabase
    .from("bro_messages")
    .select("id, attachments")
    .eq("id", messageId)
    .eq("user_id", uid)
    .eq("role", "assistant")
    .maybeSingle();
  if (!msg) return { success: false, error: "That card is gone." };
  const cards = readCards(msg.attachments);
  const card = cards[index];
  if (!card || card.type !== "hub_changes") return { success: false, error: "That card is gone." };
  if (card.status !== "proposed") return { success: true, data: card };

  if (apply) {
    const failed: string[] = [];
    for (const it of card.items) {
      if (it.action === "delete") {
        const { error } = await supabase.from("hub_items").delete().eq("id", it.id).eq("owner_id", uid);
        if (error) failed.push(it.before.title);
      } else if (it.after) {
        const a = it.after;
        const b = it.before;
        // Checklist: keep ticks on stages that stay.
        let stages: { label: string; done: boolean }[] | undefined;
        if (a.stages && JSON.stringify(a.stages) !== JSON.stringify(b.stages ?? [])) {
          const { data: cur } = await supabase.from("hub_items").select("stages").eq("id", it.id).eq("owner_id", uid).maybeSingle();
          const was = new Map(((cur?.stages as { label: string; done: boolean }[] | null) ?? []).map((st) => [st.label, st.done]));
          stages = a.stages.map((label) => ({ label, done: was.get(label) ?? false }));
        }
        const { data, error } = await supabase
          .from("hub_items")
          .update({
            title: a.title,
            ...(a.kind ? { kind: a.kind, type: a.kind === "study" ? "study_block" : "task" } : {}),
            start_at: a.start,
            end_at: a.end,
            all_day: a.allDay,
            ...(a.done !== undefined && a.done !== b.done ? { status: a.done ? "done" : "todo" } : {}),
            ...(a.timer !== undefined && a.timer !== b.timer ? { has_timer: a.timer } : {}),
            ...(a.notes !== undefined && a.notes !== b.notes ? { notes: a.notes ?? "" } : {}),
            ...(a.subjectId !== undefined && a.subjectId !== b.subjectId ? { subject_id: a.subjectId } : {}),
            ...(stages ? { stages } : {}),
            import_batch_id: null,
          })
          .eq("id", it.id)
          .eq("owner_id", uid)
          .select("id");
        if (error || !data?.length) failed.push(it.before.title);
      }
    }
    for (const st of card.sets) {
      if (st.action === "create" && st.itemIds?.length) {
        const r = await createHubSet(st.name, st.itemIds, "bro");
        if (!r.success) failed.push(st.name);
      } else if ((st.action === "add_items" || st.action === "remove_items") && st.itemIds?.length) {
        const q = supabase
          .from("hub_items")
          .update({ hub_set_id: st.action === "add_items" ? st.id : null })
          .eq("owner_id", uid)
          .in("id", st.itemIds);
        const { error } = st.action === "remove_items" ? await q.eq("hub_set_id", st.id) : await q;
        if (error) failed.push(st.name);
      } else if (st.action === "rename" && st.newName) {
        const { error } = await supabase.from("hub_sets").update({ name: st.newName, updated_at: new Date().toISOString() }).eq("id", st.id).eq("owner_id", uid);
        if (error) failed.push(st.name);
      } else if (st.action === "delete") {
        if (st.deleteItems) {
          const { error } = await supabase.from("hub_items").delete().eq("hub_set_id", st.id).eq("owner_id", uid);
          if (error) { failed.push(st.name); continue; }
        }
        const { error } = await supabase.from("hub_sets").delete().eq("id", st.id).eq("owner_id", uid);
        if (error) failed.push(st.name);
      }
    }
    revalidatePath("/hub");
    revalidatePath("/");
    if (failed.length) {
      return { success: false, error: `Couldn't change ${failed.slice(0, 3).join(", ")}${failed.length > 3 ? "…" : ""}. The rest is done; check your Hub.` };
    }
  }
  const settled: HubChangesCard = { ...card, status: apply ? "applied" : "cancelled" };
  const next = cards.map((c, i) => (i === index ? settled : c));
  const { error } = await createAdminClient().from("bro_messages").update({ attachments: next }).eq("id", messageId).eq("user_id", uid);
  if (error && !apply) return { success: false, error: "Couldn't save that. Try again?" };
  return { success: true, data: settled };
}

/** The student's own card of changes Bro proposed (RLS + owner check). */
async function loadChangesCard(uid: string, messageId: number, index: number) {
  if (!Number.isSafeInteger(messageId) || !Number.isInteger(index) || index < 0 || index > 5) return null;
  const { data: msg } = await (await createClient())
    .from("bro_messages")
    .select("id, attachments")
    .eq("id", messageId)
    .eq("user_id", uid)
    .eq("role", "assistant")
    .maybeSingle();
  if (!msg) return null;
  const cards = readCards(msg.attachments);
  const card = cards[index];
  return card && card.type === "hub_changes" ? { cards, card } : null;
}

async function saveCard(uid: string, messageId: number, cards: ReturnType<typeof readCards>, index: number, card: HubChangesCard) {
  const next = cards.map((c, i) => (i === index ? card : c));
  return createAdminClient().from("bro_messages").update({ attachments: next }).eq("id", messageId).eq("user_id", uid);
}

/**
 * "Apply changes" on a card of Hub changes Bro proposed. Applies exactly what
 * the stored card says, never anything sent from the browser, and only to the
 * student's own items and sets (RLS client plus owner_id on every write).
 */
export async function applyBroHubChanges(messageId: number, index: number): Promise<ActionResult<HubChangesCard>> {
  const uid = await getCurrentUserId();
  if (!uid) return { success: false, error: "Sign in first." };
  const found = await loadChangesCard(uid, messageId, index);
  if (!found) return { success: false, error: "That card is gone." };
  const { cards, card } = found;
  if (card.status === "applied") return { success: true, data: card };
  if (card.status === "cancelled") return { success: false, error: "That was cancelled. Ask Bro again." };

  const sb = await createClient();
  let failed = 0;
  for (const it of card.items) {
    if (it.action === "delete") {
      const { error } = await sb.from("hub_items").delete().eq("id", it.id).eq("owner_id", uid);
      if (error) failed++;
    } else if (it.after) {
      const a = it.after;
      const patch: Record<string, unknown> = { title: a.title, start_at: a.start, end_at: a.end, all_day: a.allDay };
      if (a.kind && a.kind !== it.before.kind) {
        patch.kind = a.kind;
        patch.type = a.kind === "study" ? "study_block" : "task";
        patch.has_timer = a.kind === "test" || a.kind === "mock";
      }
      const { error } = await sb.from("hub_items").update(patch).eq("id", it.id).eq("owner_id", uid);
      if (error) failed++;
    }
  }
  for (const st of card.sets) {
    if (st.action === "rename" && st.newName) {
      const { error } = await sb.from("hub_sets").update({ name: st.newName, updated_at: new Date().toISOString() }).eq("id", st.id).eq("owner_id", uid);
      if (error) failed++;
    } else if (st.action === "delete") {
      if (st.deleteItems) {
        const { error } = await sb.from("hub_items").delete().eq("hub_set_id", st.id).eq("owner_id", uid);
        if (error) failed++;
      }
      const { error } = await sb.from("hub_sets").delete().eq("id", st.id).eq("owner_id", uid);
      if (error) failed++;
    }
  }

  const applied: HubChangesCard = { ...card, status: "applied" };
  await saveCard(uid, messageId, cards, index, applied);
  revalidatePath("/hub");
  revalidatePath("/");
  if (failed) return { success: false, error: "Some of those changes didn't go through. Check your Hub." };
  return { success: true, data: applied };
}

/** "Cancel" on a card of Hub changes: nothing changes, and the card says so. */
export async function cancelBroHubChanges(messageId: number, index: number): Promise<ActionResult<HubChangesCard>> {
  const uid = await getCurrentUserId();
  if (!uid) return { success: false, error: "Sign in first." };
  const found = await loadChangesCard(uid, messageId, index);
  if (!found) return { success: false, error: "That card is gone." };
  if (found.card.status !== "proposed") return { success: true, data: found.card };
  const cancelled: HubChangesCard = { ...found.card, status: "cancelled" };
  const { error } = await saveCard(uid, messageId, found.cards, index, cancelled);
  if (error) return { success: false, error: "Couldn't update the card." };
  return { success: true, data: cancelled };
}

/**
 * A Hub set code the student gave Bro: "Keep the dates" or "Start on …" on
 * the card. Redeems the code stored on the card (not one from the browser).
 */
export async function redeemBroCodeCard(messageId: number, index: number, startOn: string | null, timezone: string): Promise<ActionResult<RedeemCard>> {
  const uid = await getCurrentUserId();
  if (!uid) return { success: false, error: "Sign in first." };
  if (!Number.isSafeInteger(messageId) || !Number.isInteger(index) || index < 0 || index > 5) return { success: false, error: "Bad request." };
  if (startOn !== null && !/^\d{4}-\d{2}-\d{2}$/.test(startOn)) return { success: false, error: "Pick a start date." };
  const { data: msg } = await (await createClient())
    .from("bro_messages")
    .select("id, attachments")
    .eq("id", messageId)
    .eq("user_id", uid)
    .eq("role", "assistant")
    .maybeSingle();
  if (!msg) return { success: false, error: "That card is gone." };
  const cards = readCards(msg.attachments);
  const card = cards[index];
  if (!card || card.type !== "redeem") return { success: false, error: "That card is gone." };
  if (card.status !== "needs_choice") return { success: true, data: card };

  let next: RedeemCard;
  try {
    const r = await redeemCode(card.code, { startOn, timezone: String(timezone || "UTC").slice(0, 64) });
    if (r.ok) next = { ...card, status: "done", result: redeemedText(r) };
    else if (r.reason === "bad_date") return { success: false, error: r.message };
    else if (r.reason === "needs_choice") return { success: false, error: "Pick keep the dates or a start day." };
    else next = { ...card, status: "failed", error: r.reason === "already_redeemed" ? "You've already redeemed this code." : "This code can't be used any more." };
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    return { success: false, error: /start date/i.test(m) ? m : "Couldn't redeem it. Try again?" };
  }
  await createAdminClient().from("bro_messages").update({ attachments: cards.map((c, i) => (i === index ? next : c)) }).eq("id", messageId).eq("user_id", uid);
  revalidatePath("/hub");
  revalidatePath("/codes");
  revalidatePath("/");
  return { success: true, data: next };
}

/**
 * "Apply" on a settings card Bro proposed: makes exactly the changes stored on
 * the card, through the same functions the settings pages use (each checks
 * the student's own account), then marks it applied. "Cancel" changes nothing.
 */
export async function settleBroSettingsCard(messageId: number, index: number, apply: boolean): Promise<ActionResult<SettingsCard>> {
  const uid = await getCurrentUserId();
  if (!uid) return { success: false, error: "Sign in first." };
  if (!Number.isSafeInteger(messageId) || !Number.isInteger(index) || index < 0 || index > 5) return { success: false, error: "Bad request." };
  const { data: msg } = await (await createClient())
    .from("bro_messages")
    .select("id, attachments")
    .eq("id", messageId)
    .eq("user_id", uid)
    .eq("role", "assistant")
    .maybeSingle();
  if (!msg) return { success: false, error: "That card is gone." };
  const cards = readCards(msg.attachments);
  const card = cards[index];
  if (!card || card.type !== "settings") return { success: false, error: "That card is gone." };
  if (card.status !== "proposed") return { success: true, data: card };

  if (apply) {
    const failed: string[] = [];
    for (const o of card.ops) {
      try {
        if (o.op === "theme") await setThemePreference(o.value);
        else if (o.op === "exam_session") await setExamSession(o.id);
        else if (o.op === "level") await setSubjectLevel(o.subjectId as never, o.level);
        else if (o.op === "add_class") await addExtraClass({ subjectId: o.subjectId as never, level: o.level });
        else if (o.op === "remove_class") await removeExtraClass(o.subjectId as never);
        else if (o.op === "pro_badge") await setProBadgeHidden(o.hidden);
        else if (o.op === "swap_core") {
          const core = (await getUserSubjects()).filter((u) => u.isCore);
          if (!core.some((u) => u.subject.id === o.from)) throw new Error("gone");
          await setCoreSubjects(
            core.map((u) =>
              u.subject.id === o.from
                ? { subjectId: o.to as never, level: o.level }
                : { subjectId: u.subject.id, level: u.level, ...(u.subject.id.startsWith("custom:") ? { name: u.subject.name } : {}) },
            ),
          );
        }
      } catch {
        failed.push(`${o.label} (${o.after})`);
      }
    }
    revalidatePath("/", "layout");
    if (failed.length) return { success: false, error: `Couldn't change ${failed.join(", ")}. Anything else on the card is done.` };
  }
  const settled: SettingsCard = { ...card, status: apply ? "applied" : "cancelled" };
  await createAdminClient().from("bro_messages").update({ attachments: cards.map((c, i) => (i === index ? settled : c)) }).eq("id", messageId).eq("user_id", uid);
  return { success: true, data: settled };
}
