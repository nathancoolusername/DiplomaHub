"use client";

import { useState } from "react";
import { Check, Copy, Crown, LogOut, Play } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { MAX_PLAYERS } from "@/lib/deadline/config";
import type { RoomActions, RoomState } from "@/lib/deadline/types";
import { nameOf, WinsBadge } from "./bits";

/** Waiting room: the code to share, who's in (with their wins), and Start for the host. */
export function Lobby({ state, actions, onInvite }: { state: RoomState; actions: Pick<RoomActions, "start" | "leave">; onInvite?: () => void }) {
  const { room, players, me } = state;
  const isHost = room.host_id === me;
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const host = players.find((p) => p.user_id === room.host_id);

  async function copy() {
    const url = `${window.location.origin}/play/deadline/${room.code}`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) await navigator.share({ title: "Deadline", text: `Join my Deadline room: ${room.code}`, url });
      else await navigator.clipboard.writeText(url);
      setCopied(true);
      onInvite?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* share sheet closed */
    }
  }
  async function start() {
    setStarting(true);
    const r = await actions.start();
    setStarting(false);
    if (!r.ok) setError(r.reason === "need_two" ? "You need at least 2 players." : "Couldn't start. Try again.");
  }

  return (
    <div className="flex flex-col gap-lg items-center text-center">
      <div className="flex flex-col items-center gap-xs">
        <p className="text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">Room code</p>
        <p className="font-mono font-black text-[3.25rem] leading-none tracking-[0.25em] pl-[0.25em] text-on-surface select-all">{room.code}</p>
        <button type="button" onClick={copy} className="mt-xs inline-flex items-center gap-xs rounded-full border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface hover:border-primary cursor-pointer">
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? "Link copied" : "Invite friends"}
        </button>
      </div>

      <section className="w-full max-w-[28rem] flex flex-col gap-sm" aria-labelledby="dl-who">
        <h2 id="dl-who" className="text-label-md font-semibold text-on-surface-variant">
          {players.length} of {MAX_PLAYERS} in the room
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
          {players.map((p) => (
            <li key={p.user_id} className="flex flex-col items-center gap-0.5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-sm">
              <span className="relative">
                <Avatar src={p.avatar_url} name={nameOf(p)} size={48} />
                {p.user_id === room.host_id && (
                  <span className="absolute -left-1 -top-1 rounded-full bg-tertiary-container text-on-tertiary-container p-0.5" title="Host"><Crown size={11} aria-hidden="true" /></span>
                )}
              </span>
              <span className="max-w-full truncate text-label-md font-semibold text-on-surface">{p.user_id === me ? "You" : nameOf(p)}</span>
              {p.guest && <span className="text-label-sm text-on-surface-variant">guest</span>}
              <WinsBadge wins={p.wins} />
            </li>
          ))}
          {Array.from({ length: Math.max(0, Math.min(2, MAX_PLAYERS - players.length)) }, (_, i) => (
            <li key={`empty-${i}`} className="rounded-2xl border border-dashed border-outline-variant p-sm flex items-center justify-center text-label-md text-on-surface-variant min-h-24">
              Waiting…
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col items-center gap-xs">
        {isHost ? (
          <button type="button" onClick={start} disabled={starting || players.length < 2}
            className="inline-flex items-center gap-sm rounded-2xl bg-primary text-on-primary px-xl py-sm text-body-lg font-bold disabled:opacity-50 cursor-pointer">
            <Play size={18} aria-hidden="true" />{starting ? "Starting…" : "Start game"}
          </button>
        ) : (
          <p className="text-body-md text-on-surface-variant">Waiting for {nameOf(host)} to start…</p>
        )}
        {isHost && players.length < 2 && <p className="text-label-md text-on-surface-variant">Share the code: you need one more player.</p>}
        {error && <p className="text-label-md text-error">{error}</p>}
      </div>

      <details className="w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-lowest text-left">
        <summary className="cursor-pointer px-md py-sm font-semibold text-on-surface">How to play</summary>
        <ul className="px-md pb-md flex flex-col gap-xs text-body-md text-on-surface-variant list-disc pl-xl">
          <li>Everyone gets a prompt like “Name an organelle”. Pass the draft by typing a right answer before your deadline.</li>
          <li>Rarer answers score more: +1 for the obvious ones, up to +7 for the rarest (a perfect 7). Every 45 points earns an extension.</li>
          <li>Miss the deadline and you lose an extension. No extensions left: you&apos;re out. Last one in wins.</li>
          <li>Typos are fine. Repeats aren&apos;t: every answer counts once per prompt.</li>
        </ul>
      </details>

      <button type="button" onClick={() => void actions.leave()} className="inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-error cursor-pointer">
        <LogOut size={14} aria-hidden="true" />Leave room
      </button>
    </div>
  );
}
