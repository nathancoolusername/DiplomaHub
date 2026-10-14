"use client";

import { useEffect, useSyncExternalStore } from "react";

// Shared Bro state, so pages can talk to the Bro button without knowing
// about it:
//  - hide it (timed sets) or lift it above a bottom bar (the player),
//  - open the bar from elsewhere ("Talk to Bro", prompt chips), with context,
//  - tell the scroll-to-top button to step aside (Bro takes its corner).

export type BroOpenRequest = {
  /** Shown as Bro's first message, e.g. the weekly brief being discussed. */
  context?: string;
  /** Sent as the student's first message straight away, e.g. a prompt chip. */
  prompt?: string;
};

type State = {
  hidden: boolean;
  bottomOffset: number;
  broMounted: boolean;
  /** The bar is open; `request` is what opened it (null = opened by the button). */
  open: boolean;
  request: BroOpenRequest | null;
};

let state: State = { hidden: false, bottomOffset: 0, broMounted: false, open: false, request: null };
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function useBroPlacement(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

export function openBro(request: BroOpenRequest | null = null) {
  set({ open: true, request });
}

export function closeBro() {
  set({ open: false, request: null });
}

export function toggleBro() {
  set({ open: !state.open, request: null });
}

/** Call from a page; resets when the page unmounts. */
export function useBroOverride(hidden: boolean, bottomOffset = 0) {
  useEffect(() => {
    set({ hidden, bottomOffset });
    return () => set({ hidden: false, bottomOffset: 0 });
  }, [hidden, bottomOffset]);
}

/** Called by BroButton while it is on the page. */
export function useBroMounted() {
  useEffect(() => {
    set({ broMounted: true });
    return () => set({ broMounted: false, open: false, request: null });
  }, []);
}

/** The bottom-right Bro button; BroBar flies its icon out from here when it opens. */
export const BRO_BUTTON_ICON_ID = "bro-button-icon";
