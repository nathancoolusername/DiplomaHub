"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { UserX, VolumeX } from "lucide-react";
import type { RoomActions, RoomPlayer } from "@/lib/deadline/types";
import { nameOf } from "./bits";

/**
 * For the host: a player's icon becomes a button that opens Mute and Remove
 * from room (in the game's seats and on the end screen). For everyone else,
 * and on your own icon, it's just the icon. The menu is portalled to <body>
 * (seats are transformed, which would trap a fixed menu inside them, and the
 * phone's scrolling row of seats would clip it).
 */
export function PlayerMenu({ player, enabled, actions, children }: {
  player: RoomPlayer | undefined;
  enabled: boolean;
  actions: Pick<RoomActions, "kick" | "mute">;
  children: React.ReactNode;
}) {
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!at) return;
    const close = () => setAt(null);
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !button.current?.contains(t)) close();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    // Only scrolling that moves the icon closes it (not the chat filling up).
    const scrolled = (e: Event) => {
      const t = e.target;
      if (t === document || (t instanceof Node && button.current && t.contains(button.current))) close();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", scrolled, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", scrolled, true);
      window.removeEventListener("resize", close);
    };
  }, [at]);

  if (!enabled || !player) return <>{children}</>;
  const name = nameOf(player);

  const toggle = () => {
    if (at) return setAt(null);
    const r = button.current?.getBoundingClientRect();
    if (r) setAt({ top: r.bottom + 6, left: Math.min(Math.max(r.left + r.width / 2, 90), window.innerWidth - 90) });
  };

  return (
    <>
      <button ref={button} type="button" onClick={toggle} aria-haspopup="menu" aria-expanded={!!at} title={`Options for ${name}`}
        className="relative rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-primary">
        {children}
      </button>
      {at && createPortal(
        <div ref={menu} role="menu" aria-label={`Options for ${name}`} style={{ top: at.top, left: at.left }}
          className="fixed z-50 -translate-x-1/2 min-w-40 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg py-xs text-label-md text-left">
          <p className="px-sm pb-xs mb-xs border-b border-outline-variant font-semibold text-on-surface truncate">{name}</p>
          <button role="menuitem" type="button" onClick={() => { void actions.mute(player.user_id, !player.muted); setAt(null); }}
            className="w-full flex items-center gap-xs px-sm py-xs text-on-surface hover:bg-surface-container cursor-pointer">
            <VolumeX size={13} aria-hidden="true" />{player.muted ? "Unmute in chat" : "Mute in chat"}
          </button>
          <button role="menuitem" type="button"
            onClick={() => { setAt(null); if (confirm(`Remove ${name} from the room? They can't come back in.`)) void actions.kick(player.user_id); }}
            className="w-full flex items-center gap-xs px-sm py-xs text-error hover:bg-surface-container cursor-pointer">
            <UserX size={13} aria-hidden="true" />Remove from room
          </button>
        </div>,
        document.body,
      )}
    </>
  );
}
