"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Lightbulb } from "lucide-react";
import { dismissHintAction } from "@/app/onboarding/actions";

// One-time tooltips. Several can be on a page; only the first pending one
// (in `order`) shows, the next appears once it's dismissed. The Midnight tip
// (components/MidnightTip.tsx) takes its turn last; announcements
// (components/NewsToast.tsx, ids "news-…") go first.

const ORDER = ["strength-map", "bro-button", "midnight"];
// Announcements first, then ORDER; ids in neither never show.
const rank = (id: string) => (id.startsWith("news-") ? -1 : ORDER.includes(id) ? ORDER.indexOf(id) : null);
let mounted: string[] = [];
let dismissedNow: string[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let snapshot = "";
const read = () => {
  const next = mounted.filter((id) => rank(id) !== null && !dismissedNow.includes(id)).sort((a, b) => rank(a)! - rank(b)!)[0] ?? "";
  snapshot = next;
  return snapshot;
};

function useCurrentHint(): string {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => "",
  );
}

/**
 * Wrap the element a hint points at. `pending` comes from the server
 * (not yet dismissed); the bubble sits above or below the child.
 */
/**
 * Takes part in the one-at-a-time queue: `show` is true when it's this tip's
 * turn; `dismiss` hides it for good (saved to the account).
 */
export function useHintTurn(id: string, pending: boolean): { show: boolean; dismiss: () => void } {
  const current = useCurrentHint();
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!pending) return;
    mounted = [...mounted, id];
    emit();
    return () => {
      mounted = mounted.filter((m) => m !== id);
      emit();
    };
  }, [id, pending]);

  const dismiss = useCallback(() => {
    setGone(true);
    dismissedNow = [...dismissedNow, id];
    emit();
    void dismissHintAction(id).catch(() => {});
  }, [id]);
  return { show: pending && !gone && current === id, dismiss };
}

export function FirstTimeHint({
  id,
  pending,
  text,
  placement = "top-end",
  children,
}: {
  id: string;
  pending: boolean;
  text: string;
  placement?: "top-end" | "bottom-start";
  children: React.ReactNode;
}) {
  const { show, dismiss } = useHintTurn(id, pending);

  return (
    <div className="relative">
      {children}
      {show && (
        <div
          role="note"
          className={`absolute z-50 w-72 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl p-md flex flex-col gap-sm ${
            placement === "top-end" ? "bottom-full right-0 mb-sm" : "top-full left-0 mt-sm"
          }`}
        >
          <p className="text-label-md flex gap-sm">
            <Lightbulb size={16} className="shrink-0 mt-px" aria-hidden="true" />
            <span>{text}</span>
          </p>
          <button type="button" onClick={dismiss} className="self-end rounded-lg bg-inverse-on-surface/15 px-md py-xs text-label-md font-semibold hover:bg-inverse-on-surface/25 cursor-pointer">
            Got it
          </button>
          <span
            aria-hidden="true"
            className={`absolute w-3 h-3 rotate-45 bg-inverse-surface ${placement === "top-end" ? "-bottom-1.5 right-6" : "-top-1.5 left-6"}`}
          />
        </div>
      )}
    </div>
  );
}
