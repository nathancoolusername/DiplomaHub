"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, MessageCircle, MoreHorizontal, Send, UserX, VolumeX, X } from "lucide-react";
import type { ChatMessage, RoomActions, RoomPlayer } from "@/lib/deadline/types";
import { nameOf } from "./bits";

const LIMIT = 200;
const REASONS: Record<string, string> = {
  slow_down: "Slow down a little.",
  muted: "The host muted you in this room.",
  too_long: `Keep it under ${LIMIT} characters.`,
  not_member: "You're not in this room any more.",
};

/**
 * Room chat: the message list with its own input. Never answers: only the
 * answer bar submits. Report on anyone else's message; the host can mute.
 */
export function ChatPanel({
  messages, players, me, isHost, actions, className = "", autoFocus = false,
}: {
  messages: ChatMessage[];
  players: RoomPlayer[];
  me: string;
  isHost: boolean;
  actions: Pick<RoomActions, "sendChat" | "report" | "mute" | "kick">;
  className?: string;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const list = useRef<HTMLOListElement>(null);
  const byId = new Map(players.map((p) => [p.user_id, p]));
  // Names of everyone who's been in the room, so a message from someone who
  // left (or was removed) still shows who wrote it.
  const [names, setNames] = useState<Record<string, string>>({});
  if (players.some((p) => names[p.user_id] !== nameOf(p))) {
    setNames({ ...names, ...Object.fromEntries(players.map((p) => [p.user_id, nameOf(p)])) });
  }
  const meMuted = byId.get(me)?.muted;

  // Stay at the bottom as messages arrive (unless you scrolled up to read).
  useEffect(() => {
    const el = list.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 120) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    const r = await actions.sendChat(body);
    if (!r.ok) {
      setText(body);
      setError(REASONS[r.reason ?? ""] ?? "Couldn't send that.");
    } else setError(null);
  }

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <ol ref={list} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-sm p-md" aria-label="Room chat" aria-live="polite">
        {messages.length === 0 && <li className="text-label-md text-on-surface-variant text-center my-auto">No messages yet. Say hi 👋</li>}
        {messages.map((m) => {
          const who = byId.get(m.user_id);
          const mine = m.user_id === me;
          return (
            <li key={m.id} className={`group relative flex flex-col max-w-[85%] ${mine ? "self-end items-end" : "self-start items-start"}`}>
              {!mine && <span className="text-label-sm font-semibold text-on-surface-variant px-xs">{who ? nameOf(who) : names[m.user_id] ?? "Someone"}</span>}
              <span className={`rounded-2xl px-sm py-xs text-body-md break-words ${mine ? "bg-primary text-on-primary rounded-br-md" : "bg-surface-container text-on-surface rounded-bl-md"}`}>
                {m.body}
              </span>
              {!mine && (
                <div className="absolute -right-7 top-4">
                  <button type="button" aria-label={`Options for ${nameOf(who)}'s message`} onClick={() => setMenu(menu === m.id ? null : m.id)}
                    className="p-1 rounded-full text-on-surface-variant opacity-60 hover:opacity-100 focus-visible:opacity-100 cursor-pointer">
                    <MoreHorizontal size={14} />
                  </button>
                  {menu === m.id && (
                    <div role="menu" className="absolute right-0 top-6 z-20 min-w-36 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg py-xs text-label-md">
                      <button role="menuitem" type="button" disabled={reported.has(m.id)}
                        onClick={() => { void actions.report(m.id); setReported(new Set(reported).add(m.id)); setMenu(null); }}
                        className="w-full flex items-center gap-xs px-sm py-xs hover:bg-surface-container disabled:opacity-50 cursor-pointer">
                        <Flag size={13} aria-hidden="true" />{reported.has(m.id) ? "Reported" : "Report message"}
                      </button>
                      {isHost && who && (
                        <button role="menuitem" type="button" onClick={() => { void actions.mute(m.user_id, !who.muted); setMenu(null); }}
                          className="w-full flex items-center gap-xs px-sm py-xs hover:bg-surface-container cursor-pointer">
                          <VolumeX size={13} aria-hidden="true" />{who.muted ? `Unmute ${nameOf(who)}` : `Mute ${nameOf(who)}`}
                        </button>
                      )}
                      {isHost && who && (
                        <button role="menuitem" type="button"
                          onClick={() => { if (confirm(`Remove ${nameOf(who)} from the room? They can't come back in.`)) void actions.kick(m.user_id); setMenu(null); }}
                          className="w-full flex items-center gap-xs px-sm py-xs text-error hover:bg-surface-container cursor-pointer">
                          <UserX size={13} aria-hidden="true" />Remove from room
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <form onSubmit={send} className="border-t border-outline-variant p-sm flex flex-col gap-xs">
        {error && <p className="text-label-sm text-error px-xs" role="alert">{error}</p>}
        <div className="flex items-center gap-xs">
          <label className="flex-1">
            <span className="sr-only">Message the room</span>
            <input value={text} onChange={(e) => { setText(e.target.value.slice(0, LIMIT)); setError(null); }}
              placeholder={meMuted ? "You're muted" : "Message the room"} disabled={meMuted} autoFocus={autoFocus}
              enterKeyHint="send" autoComplete="off"
              className="w-full rounded-full border border-outline-variant bg-surface-container-lowest px-md py-xs text-body-md text-on-surface outline-none focus:border-primary" />
          </label>
          <button type="submit" aria-label="Send" disabled={!text.trim() || meMuted}
            className="rounded-full p-sm bg-primary text-on-primary disabled:opacity-40 cursor-pointer">
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

/** Phone: the chat button (top right) with an unread dot. */
export function ChatButton({ unread, onClick }: { unread: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={unread ? `Chat, ${unread} new` : "Chat"}
      className="relative rounded-full p-sm border border-outline-variant bg-surface-container-lowest text-on-surface cursor-pointer">
      <MessageCircle size={20} />
      {unread > 0 && <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-error ring-2 ring-surface-container-lowest" aria-hidden="true" />}
    </button>
  );
}

/** Phone: chat as a sheet over the game, closed by default. */
export function ChatSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Room chat">
      <button type="button" aria-label="Close chat" onClick={onClose} className="absolute inset-0 bg-scrim/40 cursor-default" />
      <div className="absolute inset-x-0 bottom-0 h-[72dvh] rounded-t-3xl bg-surface-container-lowest shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-md pt-sm">
          <span className="mx-auto h-1 w-10 rounded-full bg-outline-variant" aria-hidden="true" />
          <button type="button" onClick={onClose} aria-label="Close chat" className="absolute right-sm top-sm p-xs text-on-surface-variant cursor-pointer"><X size={18} /></button>
        </div>
        <p className="px-md pt-xs font-semibold text-on-surface">Room chat</p>
        {children}
      </div>
    </div>
  );
}
