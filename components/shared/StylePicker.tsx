"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Lock } from "lucide-react";
import { ACCENTS, BACKDROPS, readStoredAppearance, storeAppearance, type Appearance } from "@/lib/appearance";
import { setAppearanceAction } from "@/app/actions/viewer";
import { access } from "@/lib/plans";
import { loadViewerPrefs } from "./use-is-pro";
import { UpgradePopover } from "./ProUpsell";

// The current choice, kept in step with storeAppearance() from anywhere.
const subscribe = (cb: () => void) => {
  window.addEventListener("dh-appearance", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("dh-appearance", cb);
    window.removeEventListener("storage", cb);
  };
};
let snapshot: { key: string; value: Appearance } | null = null;
const read = () => {
  const v = readStoredAppearance();
  const key = `${v.accent}/${v.backdrop}`;
  if (snapshot?.key !== key) snapshot = { key, value: v };
  return snapshot.value;
};
const serverValue: Appearance = { accent: "blue", backdrop: "plain" };

/** The saved accent and background, kept in step with storeAppearance() (the defaults on the server). */
export function useStoredAppearance(): Appearance {
  return useSyncExternalStore(subscribe, read, () => serverValue);
}

/** Accent colours (free) and backgrounds (DiplomaPro, "backgrounds"; free while Pro is coming soon), from the nav's theme picker. */
export function StylePicker({ isPro, onClose, className = "" }: { isPro: boolean | null; onClose: () => void; className?: string }) {
  const current = useStoredAppearance();
  const allowed = access("backgrounds", isPro === true).allowed;
  const [upsell, setUpsell] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (upsell) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onClick = (e: MouseEvent) => {
      // Outside the picker and its nav pill (the palette button toggles it itself).
      const box = ref.current?.parentElement ?? ref.current;
      if (box && !box.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [onClose, upsell]);

  // Merged with the latest saved choice, so two quick picks both stick.
  const choose = (patch: Partial<Appearance>) => {
    const next = { ...readStoredAppearance(), ...patch };
    if (!allowed && next.backdrop !== "plain") return setUpsell(true);
    storeAppearance(next);
    void loadViewerPrefs().then((p) => {
      if (p.signedIn) void setAppearanceAction(next).catch(() => {});
    });
  };

  if (upsell)
    return (
      <UpgradePopover
        feature="Backgrounds"
        description="Dawn, Aurora and Dusk: soft gradients behind your pages, each with its own look in Light, Dark and Midnight."
        onClose={() => {
          setUpsell(false);
          onClose();
        }}
        className={className}
      />
    );

  return (
    <div ref={ref} role="dialog" aria-label="Colours and backgrounds" className={`z-50 w-84 max-w-[calc(100vw-2rem)] rounded-xl border border-outline-variant bg-surface-raised glass shadow-xl p-md flex flex-col gap-md ${className}`}>
      <div className="flex flex-col gap-sm">
        <p className="text-label-md font-semibold text-on-surface">Accent colour</p>
        <div role="radiogroup" aria-label="Accent colour" className="grid grid-cols-6 gap-xs">
          {ACCENTS.map((a) => {
            const on = current.accent === a.id;
            return (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={a.name}
                title={`${a.name} · ${a.blurb}`}
                onClick={() => choose({ accent: a.id })}
                className="flex flex-col items-center gap-0.5 cursor-pointer group"
              >
                <span
                  className={`relative w-8 h-8 rounded-[50%] flex items-center justify-center ring-offset-2 ring-offset-surface-raised transition-shadow ${on ? "ring-2 ring-on-surface" : "group-hover:ring-2 group-hover:ring-outline"}`}
                  style={{ background: a.swatch }}
                >
                  {on && <Check size={14} className="text-white" aria-hidden="true" />}
                </span>
                <span className="text-[11px] leading-tight text-on-surface-variant">{a.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-sm">
        <p className="text-label-md font-semibold text-on-surface flex items-center gap-xs">
          Background
          {!allowed && <span className="rounded-full bg-primary/10 text-primary px-1.5 text-label-sm">DiplomaPro</span>}
        </p>
        <div role="radiogroup" aria-label="Background" className="grid grid-cols-4 gap-sm">
          {BACKDROPS.map((b) => {
            const on = current.backdrop === b.id;
            const locked = !allowed && b.id !== "plain";
            return (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={locked ? `${b.name} (DiplomaPro)` : b.name}
                title={b.name}
                onClick={() => choose({ backdrop: b.id })}
                className="flex flex-col items-center gap-0.5 cursor-pointer group"
              >
                <span
                  className={`relative w-full h-10 rounded-lg border border-outline-variant flex items-center justify-center ring-offset-2 ring-offset-surface-raised ${on ? "ring-2 ring-on-surface" : "group-hover:ring-2 group-hover:ring-outline"}`}
                  style={{ background: b.preview }}
                >
                  {on && <Check size={14} className="text-[#0b1c30]" aria-hidden="true" />}
                  {locked && <Lock size={11} className="text-[#0b1c30]/70" aria-hidden="true" />}
                </span>
                <span className="text-[11px] leading-tight text-on-surface-variant">{b.name}</span>
              </button>
            );
          })}
        </div>
        <p className="text-label-sm text-on-surface-variant">Each one has its own look in Light, Dark and Midnight.</p>
      </div>
    </div>
  );
}
