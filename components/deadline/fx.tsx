"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { soundStore, unlock } from "@/lib/deadline/sound";

// ── Player colours: each player keeps one colour for the whole room.
const PALETTE = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6", "#84cc16"];
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

/** user id → colour. Up to 8 players never share one; a player's colour stays put as others come and go (mostly). */
export function playerColors(ids: string[]): Map<string, string> {
  const out = new Map<string, string>();
  const taken = new Set<number>();
  for (const id of [...ids].sort()) {
    let i = hash(id) % PALETTE.length;
    for (let k = 0; k < PALETTE.length && taken.has(i); k++) i = (i + 1) % PALETTE.length;
    taken.add(i);
    out.set(id, PALETTE[i]);
  }
  return out;
}

/** A tint and ring in the player's colour, for Avatar's className + style on its wrapper. */
export const seatAvatarClass = "bg-(--seat)/20! text-(--seat)! border-(--seat)!";

// ── Confetti: a burst from the middle of the screen. Seeded, so it renders the same every time.
function rng(seed: number) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const CONFETTI = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#d4a017", "#ec4899"];

export function Confetti({ seed, count = 60, colors = CONFETTI, top = "35%" }: { seed: string; count?: number; colors?: string[]; top?: string }) {
  const r = rng(hash(seed));
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const angle = r() * Math.PI * 2;
        const dist = 120 + r() * 260;
        const style = {
          left: "50%", top,
          background: colors[i % colors.length],
          width: 6 + r() * 6, height: 8 + r() * 8,
          borderRadius: r() < 0.3 ? "50%" : "2px",
          "--dx": `${Math.cos(angle) * dist}px`,
          "--dy": `${Math.sin(angle) * dist * 0.7 - 80}px`,
          "--rot": `${(r() - 0.5) * 1080}deg`,
          animationDelay: `${r() * 120}ms`,
          animationDuration: `${1300 + r() * 700}ms`,
        } as React.CSSProperties;
        return <span key={i} className="dl-confetti absolute" style={style} />;
      })}
    </div>
  );
}

// ── Sound on/off.
export function useMuted() {
  return useSyncExternalStore(soundStore.subscribe, soundStore.get, () => false);
}

/** Opens the audio on the first tap or key anywhere (phones need a gesture). */
export function useUnlockAudio() {
  useEffect(() => {
    const go = () => { unlock(); window.removeEventListener("pointerdown", go); window.removeEventListener("keydown", go); };
    window.addEventListener("pointerdown", go);
    window.addEventListener("keydown", go);
    return () => { window.removeEventListener("pointerdown", go); window.removeEventListener("keydown", go); };
  }, []);
}

export function SoundToggle({ className = "" }: { className?: string }) {
  const muted = useMuted();
  return (
    <button type="button" onClick={() => soundStore.set(!muted)} aria-pressed={!muted}
      aria-label={muted ? "Turn sound on" : "Turn sound off"} title={muted ? "Sound off" : "Sound on"}
      className={`rounded-full p-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer ${className}`}>
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );
}
