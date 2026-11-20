"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/app/lib/supabase/client";
import { GRACE_MS } from "./config";
import { clockOffset, turnEndsAt } from "./clock";
import type { ChatMessage, Reaction, RoomActions, RoomState, SubmitResult, TypingStore } from "./types";

// A live Deadline room (migration 56), straight from the browser to Supabase:
//  - state: get_room_state, refetched whenever the room's private channel
//    (dl:{id}) says "state" (the broadcast carries the new state, so usually
//    no fetch at all), on reconnect, when the tab comes back, and on a slow
//    poll as a safety net (faster if the channel is down);
//  - chat, reactions and hidden messages arrive on the same channel;
//  - after the turn's deadline (server time) one tick_room call times it out.

export type RoomLoad = { status: "ok" } | { status: "gone"; reason: string };

const POLL_LIVE_MS = 20_000;
const POLL_DOWN_MS = 3_000;
const BUBBLE_MS = 2_000;
const TYPING_EVERY_MS = 70;
const TYPING_MAX = 60;

/** A tiny external store for live typing (user id → text). */
export function makeTypingStore() {
  let value: Record<string, string> = {};
  const listeners = new Set<() => void>();
  return {
    subscribe: (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    get: () => value,
    set: (next: Record<string, string>) => { value = next; listeners.forEach((l) => l()); },
  };
}

export function useRoom(code: string, initial: RoomState) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [offset, setOffset] = useState(() => clockOffset(initial.server_now));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [load, setLoad] = useState<RoomLoad>({ status: "ok" });
  const [live, setLive] = useState(false);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // ── State: one fetch at a time; a change during a fetch fetches once more.
  const inFlight = useRef(false);
  const again = useRef(false);
  const refetch = useCallback(async () => {
    if (inFlight.current) { again.current = true; return; }
    inFlight.current = true;
    try {
      do {
        again.current = false;
        const sent = Date.now();
        const { data, error } = await supabase.rpc("get_room_state", { p_code: code });
        if (error) continue;
        const r = data as RoomState | { ok: false; reason: string };
        if (!r.ok) { setLoad({ status: "gone", reason: r.reason }); return; }
        setOffset(clockOffset(r.server_now, (sent + Date.now()) / 2));
        setState((old) => (r.room.version >= old.room.version || r.room.id !== old.room.id ? r : old));
      } while (again.current);
    } finally {
      inFlight.current = false;
    }
  }, [supabase, code]);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.rpc("get_room_messages", { p_room: stateRef.current.room.id });
    if (Array.isArray(data)) setMessages(data as ChatMessage[]);
  }, [supabase]);

  // ── Live typing on its own channel, dl-typing:{room}: members (not muted)
  //    may broadcast there; the game channel dl:{room} stays server-only, so
  //    nobody can fake a game event. Sent at once, then at most every 70 ms.
  const typingStore = useMemo(() => makeTypingStore(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingRef = useRef<RealtimeChannel | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingLast = useRef({ at: 0, text: "" });
  const typingLatest = useRef("");
  const sendTyping = useCallback(() => {
    const text = typingLatest.current;
    if (text === typingLast.current.text) return;
    typingLast.current = { at: Date.now(), text };
    void typingRef.current?.send({ type: "broadcast", event: "typing", payload: { u: stateRef.current.me, t: text } });
  }, []);
  const onTyping = useCallback((text: string) => {
    typingLatest.current = text.slice(0, TYPING_MAX);
    if (typingTimer.current) return;
    const wait = Math.max(0, TYPING_EVERY_MS - (Date.now() - typingLast.current.at));
    if (wait === 0) return sendTyping();
    typingTimer.current = setTimeout(() => { typingTimer.current = null; sendTyping(); }, wait);
  }, [sendTyping]);

  // ── The room's private channel.
  const roomId = state.room.id;
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let typing: RealtimeChannel | null = null;
    let cancelled = false;
    void loadMessages();
    (async () => {
      await supabase.realtime.setAuth();
      if (cancelled) return;
      channel = supabase.channel(`dl:${roomId}`, { config: { private: true } })
        .on("broadcast", { event: "state" }, ({ payload }) => {
          // The new state rides along: apply it (one trip instead of two). Only
          // squad membership on "Save as squad" is per-player, so fetch for that.
          const next = (payload as { state?: RoomState | null })?.state;
          if (!next || !next.ok) return void refetch();
          const cur = stateRef.current;
          const squad = next.room.saved_squad;
          const known = squad && cur.room.saved_squad?.id === squad.id ? cur.room.saved_squad.member : undefined;
          setState((old) => (next.room.version < old.room.version ? old
            : { ...next, me: old.me, room: { ...next.room, saved_squad: squad ? { ...squad, member: known ?? false } : null } }));
          if (squad && known === undefined) void refetch();
        })
        .on("broadcast", { event: "chat" }, ({ payload }) => {
          const m = payload as ChatMessage;
          setMessages((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m].slice(-200)));
        })
        .on("broadcast", { event: "hide" }, ({ payload }) => {
          const id = (payload as { id: string }).id;
          setMessages((ms) => ms.filter((m) => m.id !== id));
        })
        .on("broadcast", { event: "react" }, ({ payload }) => {
          const r = payload as { user_id: string; emoji: string };
          const reaction = { id: `${Date.now()}-${Math.random()}`, ...r };
          setReactions((rs) => [...rs.slice(-30), reaction]);
          setTimeout(() => setReactions((rs) => rs.filter((x) => x.id !== reaction.id)), BUBBLE_MS);
        })
        .subscribe((status) => {
          const up = status === "SUBSCRIBED";
          setLive(up);
          // Back on the channel: catch up on anything missed while away.
          if (up) { void refetch(); void loadMessages(); }
        });
      channelRef.current = channel;
      // Typing: shown only for players in the room who aren't muted, capped in length.
      typing = supabase.channel(`dl-typing:${roomId}`, { config: { private: true } })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          const { u, t } = (payload ?? {}) as { u?: string; t?: string };
          const p = stateRef.current.players.find((x) => x.user_id === u);
          if (!u || typeof t !== "string" || !p || p.muted) return;
          typingStore.set({ ...typingStore.get(), [u]: t.slice(0, TYPING_MAX) });
        })
        .subscribe();
      typingRef.current = typing;
    })();
    return () => {
      cancelled = true;
      channelRef.current = null;
      typingRef.current = null;
      if (channel) void supabase.removeChannel(channel);
      if (typing) void supabase.removeChannel(typing);
    };
  }, [supabase, roomId, refetch, loadMessages, typingStore]);

  // A new turn: nobody's old text lingers.
  const turnKey = state.round ? `${state.round.id}:${state.round.holder_id}:${state.round.turn_started_at}` : null;
  useEffect(() => {
    typingStore.set({});
    typingLast.current = { at: 0, text: "" };
  }, [turnKey, typingStore]);

  // ── Safety nets: the tab coming back, and a poll (faster while the channel is down).
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") { void refetch(); void loadMessages(); } };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    const t = setInterval(() => { if (document.visibilityState === "visible") void refetch(); }, live ? POLL_LIVE_MS : POLL_DOWN_MS);
    return () => { document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("online", onVisible); clearInterval(t); };
  }, [refetch, loadMessages, live]);

  // ── The deadline: once the (server) deadline has passed, ask the server to
  //    time the turn out. A little random wait so 8 phones don't all call at once.
  const round = state.round;
  const deadlineKey = state.room.status === "playing" && round ? `${round.id}:${round.turn_started_at}:${round.turn_ms}` : null;
  useEffect(() => {
    const r = stateRef.current.round;
    if (!deadlineKey || !r) return;
    let t: ReturnType<typeof setTimeout>;
    const fire = async (tries: number) => {
      const { data } = await supabase.rpc("tick_room", { p_room: stateRef.current.room.id });
      const fired = (data as { fired?: boolean } | null)?.fired;
      await refetch();
      // Nobody could time it out yet (clocks a hair apart): try again shortly.
      const cur = stateRef.current.round;
      if (!fired && tries < 5 && cur && `${cur.id}:${cur.turn_started_at}:${cur.turn_ms}` === deadlineKey) t = setTimeout(() => void fire(tries + 1), 300);
    };
    // Just past the server's grace, with a little spread so 8 phones don't all call at once.
    const wait = turnEndsAt(r) + GRACE_MS + 60 + Math.random() * 140 - (Date.now() + offset);
    t = setTimeout(() => void fire(0), Math.max(0, wait));
    return () => clearTimeout(t);
  }, [deadlineKey, offset, supabase, refetch]);

  // ── Actions: RPCs from the browser (no server hop).
  const actions: RoomActions = useMemo(() => {
    const room = () => stateRef.current.room.id;
    return {
      submit: async (text) => {
        const { data, error } = await supabase.rpc("submit_answer", { p_room: room(), p_text: text });
        if (error) return { result: "not_playing" };
        const r = data as SubmitResult;
        if (r.result === "ok" || r.result === "too_late") void refetch();
        return r;
      },
      appeal: async (rejectId) => { await supabase.rpc("appeal_answer", { p_reject: rejectId }); },
      start: async () => {
        const { data, error } = await supabase.rpc("start_game", { p_room: room() });
        if (error) return { ok: false, reason: "error" };
        void refetch();
        return data as { ok: boolean; reason?: string };
      },
      leave: async () => {
        await supabase.rpc("leave_room", { p_room: room() });
        router.push("/play/deadline");
      },
      sendChat: async (body) => {
        const { data, error } = await supabase.rpc("send_room_message", { p_room: room(), p_body: body });
        if (error) return { ok: false };
        const r = data as { ok: boolean; reason?: string; id?: string; created_at?: string };
        if (r.ok && r.id) {
          const m = { id: r.id, user_id: stateRef.current.me, body: body.replace(/\s+/g, " ").trim(), created_at: r.created_at! };
          setMessages((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m]));
        }
        return r;
      },
      react: async (emoji) => { await supabase.rpc("send_reaction", { p_room: room(), p_emoji: emoji }); },
      report: async (messageId) => { await supabase.rpc("report_room_message", { p_message: messageId, p_reason: null }); },
      mute: async (userId, muted) => { await supabase.rpc("host_mute", { p_room: room(), p_user: userId, p_muted: muted }); void refetch(); },
      kick: async (userId) => {
        const { data, error } = await supabase.rpc("kick_player", { p_room: room(), p_user: userId });
        if (error) return { ok: false, reason: "error" };
        void refetch();
        return data as { ok: boolean; reason?: string };
      },
      listSubjects: async () => {
        const { data } = await supabase.rpc("deadline_subjects");
        return Array.isArray(data) ? (data as { subject: string; prompts: number }[]) : [];
      },
      setSubjects: async (subjects) => {
        const { data, error } = await supabase.rpc("set_room_subjects", { p_room: room(), p_subjects: subjects });
        if (error) return { ok: false, reason: "error" };
        void refetch();
        return data as { ok: boolean; reason?: string; prompts?: number };
      },
      saveSquad: async (name) => {
        const { data, error } = await supabase.rpc("save_room_as_squad", { p_room: room(), p_name: name });
        if (error) {
          const reason = /up to 5 squads/i.test(error.message) ? "too_many" : /today/i.test(error.message) ? "rate_limited" : /name/i.test(error.message) ? "bad_name" : "error";
          return { ok: false, reason };
        }
        void refetch();
        return data as { ok: boolean; reason?: string; code?: string };
      },
    };
  }, [supabase, refetch, router]);

  const logEvent = useCallback((kind: "invite_copied" | "chat_opened", data: Record<string, unknown> = {}) => {
    void supabase.rpc("log_deadline_event", { p_kind: kind, p_room: stateRef.current.room.id, p_data: data });
  }, [supabase]);

  // Removed or the room closed: stop listening to it.
  useEffect(() => {
    if (load.status === "gone" && channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (load.status === "gone" && typingRef.current) {
      void supabase.removeChannel(typingRef.current);
      typingRef.current = null;
    }
  }, [load.status, supabase]);

  const typing: TypingStore = typingStore;
  return { state, offset, messages, reactions, actions, load, live, logEvent, typing, onTyping };
}
