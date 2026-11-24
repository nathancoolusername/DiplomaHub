"use client";

import { REACTIONS } from "@/lib/deadline/config";
import type { Reaction } from "@/lib/deadline/types";

/** The emoji row: one tap sends to the room (no typing mid-turn). */
export function ReactionBar({ onReact, className = "" }: { onReact: (emoji: string) => void; className?: string }) {
  return (
    <div className={`flex justify-center gap-0.5 ${className}`} role="group" aria-label="React">
      {REACTIONS.map((e) => (
        <button key={e} type="button" onClick={() => onReact(e)} aria-label={`React ${e}`}
          className="rounded-full h-9 w-9 text-xl leading-none hover:bg-surface-container active:scale-90 transition-transform cursor-pointer">
          {e}
        </button>
      ))}
    </div>
  );
}

/** Reactions floating up from a seat (the latest few from that player). */
export function Bubbles({ reactions }: { reactions: Reaction[] }) {
  if (!reactions.length) return null;
  return (
    <span className="pointer-events-none absolute inset-x-0 -top-2 flex justify-center" aria-hidden="true">
      {reactions.slice(-3).map((r, i) => (
        <span key={r.id} className="dl-bubble absolute text-2xl" style={{ marginLeft: (i - 1) * 14 }}>{r.emoji}</span>
      ))}
    </span>
  );
}
