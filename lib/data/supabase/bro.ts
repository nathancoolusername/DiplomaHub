import "server-only";

import { createAdminClient } from "@/app/lib/supabase/admin";
import { check, db, requireUserId } from "./client";

// DiplomaBro chat history ─ bro_messages (migration 37), in chats
// (bro_conversations, migration 40). Students read and delete their own rows
// through RLS; only the chat route writes, with the service role, so nobody
// can plant fake assistant turns.

export type BroMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  /** Bro's replies the student has flagged. */
  flagged?: boolean;
  /** Cards on Bro's reply (migration 45). */
  attachments?: unknown[];
};

export type BroFlagReason = "wrong" | "ib_fact" | "unhelpful" | "other";

export type BroUsage = { model: string; input: number; output: number; cacheRead: number; cacheWrite: number };

export type BroConversation = { id: string; title: string; updatedAt: string };

/** The student's chats, most recent first (migration 40). */
export async function getBroConversations(limit = 30): Promise<BroConversation[]> {
  const uid = await requireUserId();
  const { data, error } = await (await db())
    .from("bro_conversations")
    .select("id, title, updated_at")
    .eq("user_id", uid)
    .order("updated_at", { ascending: false })
    .limit(limit);
  check(error);
  return (data ?? []).map((c) => ({ id: c.id as string, title: c.title as string, updatedAt: c.updated_at as string }));
}

/**
 * One chat's most recent messages, oldest first: the given chat, or the
 * latest one when none is given. conversationId is null when there's none
 * (or it isn't theirs: RLS only shows their own).
 */
export async function getBroHistory(conversationId: string | null, limit = 40): Promise<{ conversationId: string | null; messages: BroMessage[] }> {
  const uid = await requireUserId();
  const sb = await db();
  let id = conversationId;
  if (!id) {
    const { data, error } = await sb.from("bro_conversations").select("id").eq("user_id", uid).order("updated_at", { ascending: false }).limit(1);
    check(error);
    id = (data?.[0]?.id as string | undefined) ?? null;
  }
  if (!id) return { conversationId: null, messages: [] };
  const { data, error } = await sb
    .from("bro_messages")
    .select("id, role, content, attachments")
    .eq("user_id", uid)
    .eq("conversation_id", id)
    .order("id", { ascending: false })
    .limit(limit);
  check(error);
  const rows = ((data ?? []) as BroMessage[]).reverse();
  if (!rows.length && conversationId) {
    // Not theirs, or deleted.
    const { data: own } = await sb.from("bro_conversations").select("id").eq("id", id).eq("user_id", uid).maybeSingle();
    if (!own) return { conversationId: null, messages: [] };
  }
  const replyIds = rows.filter((m) => m.role === "assistant").map((m) => m.id);
  if (replyIds.length) {
    const { data: flags, error: e2 } = await sb.from("bro_flags").select("message_id").in("message_id", replyIds);
    check(e2);
    const flagged = new Set((flags ?? []).map((f) => f.message_id as number));
    for (const m of rows) if (flagged.has(m.id)) m.flagged = true;
  }
  return { conversationId: id, messages: rows };
}

/** "This is wrong": flags one of Bro's replies to the student (flag_bro_message, migration 38). */
export async function flagBroMessage(messageId: number, reason: BroFlagReason, note: string | null): Promise<void> {
  const { error } = await (await db()).rpc("flag_bro_message", { p_message_id: messageId, p_reason: reason, p_note: note });
  check(error);
}

/** The latest chat about one practice attempt (migration 43), or null. */
export async function getAttemptConversationId(attemptId: string): Promise<string | null> {
  const uid = await requireUserId();
  const { data, error } = await (await db())
    .from("bro_conversations")
    .select("id")
    .eq("user_id", uid)
    .eq("attempt_id", attemptId)
    .order("updated_at", { ascending: false })
    .limit(1);
  check(error);
  return (data?.[0]?.id as string | undefined) ?? null;
}

/** Which attempt a chat is about: its id, null for a general chat, undefined when it isn't theirs. */
export async function getConversationAttempt(conversationId: string): Promise<string | null | undefined> {
  const uid = await requireUserId();
  const { data } = await (await db()).from("bro_conversations").select("attempt_id").eq("id", conversationId).eq("user_id", uid).maybeSingle();
  return data ? ((data.attempt_id as string | null) ?? null) : undefined;
}

/** Deletes one of the student's chats and its messages. */
export async function deleteBroConversation(id: string): Promise<void> {
  const uid = await requireUserId();
  const { error } = await (await db()).from("bro_conversations").delete().eq("id", id).eq("user_id", uid);
  check(error);
}

/** A chat title from its first message. */
function titleFrom(question: string): string {
  const t = question.replace(/\s+/g, " ").trim();
  return t.length <= 60 ? t : `${t.slice(0, 57).trimEnd()}…`;
}

/**
 * Server only (the chat route): saves one exchange for this student, in the
 * given chat or a new one (conversationId null). Returns the chat and the reply's id.
 */
export async function saveBroExchange(
  userId: string,
  conversationId: string | null,
  question: string,
  answer: string,
  usage: BroUsage,
  /** A new chat about a practice set: linked to the attempt and named after the set. */
  forAttempt?: { attemptId: string; setTitle: string },
  /** Cards on the reply (sets Bro built, Hub items it proposed). */
  attachments: unknown[] = [],
): Promise<{ conversationId: string; replyId: number }> {
  const admin = createAdminClient();
  let id = conversationId;
  const now = new Date().toISOString();
  if (id) {
    const { data, error } = await admin.from("bro_conversations").update({ updated_at: now }).eq("id", id).eq("user_id", userId).select("id").maybeSingle();
    check(error);
    if (!data) id = null; // Deleted meanwhile (or not theirs): start a new chat.
  }
  if (!id) {
    const { data, error } = await admin
      .from("bro_conversations")
      .insert(
        forAttempt
          ? { user_id: userId, title: titleFrom(forAttempt.setTitle) || "Practice", attempt_id: forAttempt.attemptId }
          : { user_id: userId, title: titleFrom(question) || "Chat" },
      )
      .select("id")
      .single();
    check(error);
    id = data!.id as string;
  }
  const { data, error } = await admin
    .from("bro_messages")
    .insert([
      // Every row lists every column: in a multi-row insert a missing key is sent as null, not the
      // column default, and attachments is not null (the bug that dropped every reply after migration 45).
      { user_id: userId, conversation_id: id, role: "user", content: question, attachments: [] },
      {
        user_id: userId,
        conversation_id: id,
        role: "assistant",
        content: answer,
        model: usage.model,
        input_tokens: usage.input,
        output_tokens: usage.output,
        cache_read_tokens: usage.cacheRead,
        cache_write_tokens: usage.cacheWrite,
        attachments,
      },
    ])
    .select("id, role");
  check(error);
  return { conversationId: id, replyId: (data ?? []).find((r) => r.role === "assistant")!.id as number };
}
