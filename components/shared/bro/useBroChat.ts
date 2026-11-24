"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BroOpenRequest, BroQuestion, BroReviewRef } from "./bro-visibility";
import { readCards, type BroCard } from "@/lib/bro/cards";

// The chat itself, shared by the Bro bar (BroBar) and the full page (/bro).
// Talks to app/api/bro/chat: GET opens a chat (default: the latest) and lists
// the student's chats, POST streams a reply as NDJSON lines (delta / memory /
// forgot / done / error), DELETE ?c= deletes a chat. "New chat" only clears
// the screen: the chat is created with its first message, and the old one
// stays in the list.

export type BroChatMessage =
  | {
      role: "user" | "bro";
      text: string;
      error?: boolean;
      id?: number;
      flagged?: boolean;
      cards?: BroCard[];
      note?: string;
      /** While a tool runs: "Building your set…". */
      status?: string;
    }
  /** Bro remembered (memoryId set) or forgot something. Shown in the chat only, not saved with it. */
  | { role: "memory"; text: string; memoryId?: number; undone?: boolean }
  /** Bro logged a test result on the Progress page. Shown in the chat only. */
  | { role: "result"; text: string; resultId: string; undone?: boolean };

/** idle, waiting for the first words, or words streaming in. */
export type BroPhase = "idle" | "thinking" | "answering";

export type BroChatSummary = { id: string; title: string; updatedAt: string };

type Saved = { id: number; role: "user" | "assistant"; content: string; flagged?: boolean; attachments?: unknown };

function toMessages(saved: Saved[]): BroChatMessage[] {
  return saved.map((m) =>
    m.role === "user" ? { role: "user", text: m.content } : { role: "bro", text: m.content, id: m.id, flagged: m.flagged, cards: readCards(m.attachments) },
  );
}

/** Cmd/Ctrl+N (where the browser lets a page have it) or Cmd/Ctrl+Shift+O: new chat. */
export function isNewChatShortcut(e: KeyboardEvent): boolean {
  if (!(e.metaKey || e.ctrlKey) || e.altKey) return false;
  const k = e.key.toLowerCase();
  return (k === "n" && !e.shiftKey) || (k === "o" && e.shiftKey);
}

type Line =
  | { t: "delta"; text: string }
  | { t: "done"; id: number; conversationId: string; remaining: number | null }
  | { t: "memory"; id: number; kind: string; content: string }
  | { t: "forgot"; content: string }
  | { t: "result"; id: string; text: string }
  | { t: "card"; card: BroCard }
  | { t: "status"; text: string }
  | { t: "error"; message: string };

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    if (body.message) return body.message;
  } catch {
    // Not JSON.
  }
  return "Something went wrong. Try again?";
}

// ── Opening without a flicker ────────────────────────────────────────────
// The latest chat and the chats list are kept here for this page visit:
// /bro (which opens on the latest chat) shows it straight away, and the bar,
// which always starts a new chat, has its "Past chats" list ready. The first
// load can start early (prefetchBroChat on hovering the Bro button). Fresh
// data still replaces it once it arrives.

type Snapshot = { conversationId: string | null; messages: BroChatMessage[]; chats: BroChatSummary[] };
let snapshot: Snapshot | null = null;
const isFailed = (m: BroChatMessage | undefined) => !!m && m.role === "bro" && !!m.error;
let inflight: Promise<Snapshot | null> | null = null;

function loadLatest(): Promise<Snapshot | null> {
  inflight ??= (async () => {
    try {
      const res = await fetch("/api/bro/chat", { cache: "no-store" });
      if (!res.ok) return null;
      const body = (await res.json()) as { conversationId: string | null; messages: Saved[]; conversations: BroChatSummary[] };
      return { conversationId: body.conversationId, messages: toMessages(body.messages), chats: body.conversations };
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

let owner: string | null = null;

/**
 * Called with the signed-in account on every page change (GlobalBro): a
 * different account (or signing out) drops the kept chat, so one student's
 * chat can never show for the next person on the same computer.
 */
export function setBroChatOwner(userId: string | null) {
  if (userId !== owner) {
    snapshot = null;
    owner = userId;
  }
}

// Warm-up: opening Bro asks the server to put the student's context in the model's cache
// (POST {warm:true}), so the first message starts straight away. The server limits it too.
let warmedAt = 0;
function warmBro() {
  if (Date.now() - warmedAt < 5 * 60_000) return;
  warmedAt = Date.now();
  void fetch("/api/bro/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ warm: true, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    keepalive: true,
  }).catch(() => {
    warmedAt = 0;
  });
}

/** Starts loading the latest chat before the bar opens (Bro button hover). */
export function prefetchBroChat() {
  if (!snapshot && !inflight) void loadLatest().then((s) => (snapshot = s ?? snapshot));
}

/**
 * `attemptId`: Bro was opened with a practice question on screen, so it opens
 * that set's own chat (or a new one), never the latest general chat.
 * `startFresh`: the Bro bar (Cmd/Ctrl+K, the Bro button) always starts a new
 * chat; past chats are a tap away in "Past chats" and on /bro, which opens
 * on the latest.
 */
export function useBroChat(request: BroOpenRequest | null = null, attemptId: string | null = null, startFresh = false) {
  // What this opening shows, fixed at mount: that set's chat, a fresh chat (the bar, "Talk to Bro", chips), or the latest chat (/bro).
  const [mode] = useState<"attempt" | "fresh" | "latest">(() => (attemptId ? "attempt" : request || startFresh ? "fresh" : "latest"));
  const [forAttempt] = useState(attemptId);
  // Opened plainly with a chat already in hand: show it at once.
  const [cached] = useState(() => (mode === "latest" ? snapshot : null));
  const [messages, setMessages] = useState<BroChatMessage[]>(() =>
    cached ? cached.messages : request?.context ? [{ role: "bro", text: request.context }] : [],
  );
  const [loaded, setLoaded] = useState(!!cached);
  const [phase, setPhase] = useState<BroPhase>("idle");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(cached?.conversationId ?? null);
  const [chats, setChats] = useState<BroChatSummary[]>(cached?.chats ?? []);

  // Keep the snapshot current, so the next opening starts where this one left off.
  useEffect(() => {
    // Failed exchanges (the question and its error) aren't kept: they were never saved either.
    // Only the general chat is kept: a set's chat shouldn't greet the next plain opening.
    if (phase === "idle" && mode === "latest") snapshot = { conversationId, messages: messages.filter((m, i) => !isFailed(m) && !isFailed(messages[i + 1])), chats };
  }, [conversationId, messages, chats, phase, mode]);
  const abortRef = useRef<AbortController | null>(null);
  const stoppedRef = useRef(false);
  const lastQuestionRef = useRef<BroQuestion | null>(null);
  // A review comment Bro was opened on: sent with every message in that chat, so Bro keeps the pages.
  const reviewRefRef = useRef<BroReviewRef | null>(null);
  // Read inside send without making it change on every chat switch.
  const chatRef = useRef<string | null>(null);
  chatRef.current = conversationId;
  const busy = phase !== "idle";

  // Stop a reply that's still streaming when the chat goes away.
  useEffect(() => () => abortRef.current?.abort(), []);
  // Opening Bro warms the cache while they type.
  useEffect(() => warmBro(), []);

  const send = useCallback(
    async (text: string, opener?: string, question?: BroQuestion | null, review?: BroReviewRef | null) => {
      const trimmed = text.trim();
      if (!trimmed || abortRef.current) return;
      lastQuestionRef.current = question ?? null;
      if (review) reviewRefRef.current = review;
      const reviewNow = review ?? reviewRefRef.current;
      setPhase("thinking");
      // Never just dots: a status from the first moment, replaced as Bro moves along.
      setMessages((m) => [...m, { role: "user", text: trimmed }, { role: "bro", text: "", status: question ? "Reading the question…" : "Reading your message…" }]);
      // Bro's reply is the last "bro" message; memory notes go just before it.
      const setReply = (update: (prev: BroChatMessage) => BroChatMessage) =>
        setMessages((m) => {
          const i = m.findLastIndex((x) => x.role === "bro");
          return i < 0 ? m : [...m.slice(0, i), update(m[i]), ...m.slice(i + 1)];
        });
      const addNote = (note: BroChatMessage) =>
        setMessages((m) => {
          const i = m.findLastIndex((x) => x.role === "bro");
          return i < 0 ? [...m, note] : [...m.slice(0, i), note, ...m.slice(i)];
        });

      const controller = new AbortController();
      abortRef.current = controller;
      stoppedRef.current = false;
      // Text arrives token by token; it's drawn at most once a frame, so long replies don't stutter.
      let pending = "";
      let frame = 0;
      const flush = () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        if (!pending) return;
        const add = pending;
        pending = "";
        setReply((r) => ({ ...r, text: r.text + add, status: undefined }));
      };
      try {
        const res = await fetch("/api/bro/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            opener,
            conversationId: chatRef.current,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            // The question on screen goes by reference; the server loads it from the student's own attempt.
            question: question ? { attemptId: question.attemptId, questionId: question.questionId } : undefined,
            // A review comment, also by reference: loaded from the student's own draft.
            review: reviewNow ? { draftId: reviewNow.draftId, comment: reviewNow.comment } : undefined,
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const message = await readError(res);
          setReply(() => ({ role: "bro", text: message, error: true }));
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const raw = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            if (!raw.trim()) continue;
            const line = JSON.parse(raw) as Line;
            if (line.t === "delta") {
              setPhase("answering");
              pending += line.text;
              frame ||= requestAnimationFrame(flush);
              continue;
            }
            flush();
            if (line.t === "status") {
              setReply((r) => (r.role === "bro" ? { ...r, status: line.text } : r));
            } else if (line.t === "memory") {
              addNote({ role: "memory", text: line.content, memoryId: line.id });
            } else if (line.t === "forgot") {
              addNote({ role: "memory", text: line.content });
            } else if (line.t === "card") {
              setReply((r) => (r.role === "bro" ? { ...r, cards: [...(r.cards ?? []), line.card], status: undefined } : r));
            } else if (line.t === "result") {
              addNote({ role: "result", text: line.text, resultId: line.id });
            } else if (line.t === "done") {
              setRemaining(line.remaining);
              setReply((r) => ({ ...r, id: line.id, status: undefined }));
              // A new chat now exists (or an old one moved to the top of the list).
              setConversationId(line.conversationId);
              setChats((list) => {
                const old = list.find((c) => c.id === line.conversationId);
                const title = old?.title ?? (trimmed.length <= 60 ? trimmed : `${trimmed.slice(0, 57).trimEnd()}…`);
                return [{ id: line.conversationId, title, updatedAt: new Date().toISOString() }, ...list.filter((c) => c.id !== line.conversationId)];
              });
            } else {
              // A reply that already arrived stays on screen (with its cards); only an empty one becomes the error.
              setReply((r) =>
                r.role === "bro" && (r.text.trim() || r.cards?.length) ? { ...r, note: line.message } : { role: "bro", text: line.message, error: true },
              );
            }
          }
        }
      } catch {
        if (!controller.signal.aborted) setReply(() => ({ role: "bro", text: "Couldn't reach Bro. Check your connection?", error: true }));
      } finally {
        flush();
        if (stoppedRef.current) {
          // Stopped by the student: what came in stays on screen, but it wasn't saved.
          setReply((r) =>
            r.role === "bro" && (r.text.trim() || r.cards?.length)
              ? { ...r, status: undefined, note: "Stopped. This reply wasn't saved." }
              : { role: "bro", text: "Stopped.", error: true },
          );
        }
        abortRef.current = null;
        setPhase("idle");
      }
    },
    [],
  );

  // Load the saved chat, then send a prompt chip's message if one opened Bro.
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    (async () => {
      try {
        if (mode === "attempt" && forAttempt) {
          // The chat about this practice set (none yet = a new chat, created with the first message).
          const res = await fetch(`/api/bro/chat?attempt=${encodeURIComponent(forAttempt)}`, { cache: "no-store" });
          if (res.ok) {
            const body = (await res.json()) as { conversationId: string | null; messages: Saved[]; conversations: BroChatSummary[] };
            setChats(body.conversations);
            setConversationId(body.conversationId);
            setMessages((m) => [...toMessages(body.messages), ...m]);
          }
        } else {
          const fresh = await loadLatest();
          if (fresh) {
            setChats(fresh.chats);
            // "Talk to Bro" and prompt chips start a fresh chat; otherwise Bro opens on the latest one.
            // With a snapshot already showing, only replace it if something changed elsewhere (another tab).
            if (mode === "latest" && (!cached || cached.conversationId !== fresh.conversationId || cached.messages.length !== fresh.messages.length)) {
              setConversationId(fresh.conversationId);
              setMessages(fresh.messages);
            }
          }
        }
      } finally {
        setLoaded(true);
      }
      if (request?.prompt) void send(request.prompt, request.context, request.question, request.review);
    })();
  }, [request, send, cached, mode, forAttempt]);

  /** Clears the screen for a new chat; the old one stays in the list. */
  const newChat = useCallback(() => {
    reviewRefRef.current = null;
    abortRef.current?.abort();
    setConversationId(null);
    setMessages([]);
  }, []);

  /** Opens one of the student's past chats. */
  const openChat = useCallback(async (id: string) => {
    reviewRefRef.current = null;
    abortRef.current?.abort();
    setConversationId(id);
    setMessages([]);
    setLoaded(false);
    try {
      const res = await fetch(`/api/bro/chat?c=${encodeURIComponent(id)}`, { cache: "no-store" });
      if (res.ok) {
        const body = (await res.json()) as { conversationId: string | null; messages: Saved[]; conversations: BroChatSummary[] };
        setChats(body.conversations);
        setConversationId(body.conversationId);
        setMessages(toMessages(body.messages));
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  /** Deletes a chat for good. */
  const deleteChat = useCallback(async (id: string) => {
    const res = await fetch(`/api/bro/chat?c=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) return;
    setChats((list) => list.filter((c) => c.id !== id));
    if (chatRef.current === id) {
      setConversationId(null);
      setMessages([]);
    }
  }, []);

  // The first message after "Talk to Bro" carries the brief, so Bro knows what it's following up.
  const hasSent = messages.some((m) => m.role === "user");
  const submit = (text: string, question?: BroQuestion | null) => void send(text, !hasSent ? request?.context : undefined, question);

  /** Stops the reply that's coming in. */
  const stop = useCallback(() => {
    if (!abortRef.current) return;
    stoppedRef.current = true;
    abortRef.current.abort();
  }, []);

  /** Sends the last message again after an error (the failed exchange is replaced). */
  const retry = useCallback(() => {
    if (abortRef.current) return;
    const last = messages.findLastIndex((m) => m.role === "user");
    if (last < 0) return;
    const text = messages[last].text;
    setMessages((m) => m.slice(0, last));
    void send(text, undefined, lastQuestionRef.current);
  }, [messages, send]);

  return { messages, setMessages, loaded, phase, busy, remaining, submit, newChat, hasSent, conversationId, chats, openChat, deleteChat, stop, retry };
}
