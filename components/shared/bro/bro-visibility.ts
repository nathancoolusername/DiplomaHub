"use client";

import { useEffect, useSyncExternalStore } from "react";

// Shared Bro state, so pages can talk to the Bro button without knowing
// about it:
//  - hide it (timed sets) or lift it above a bottom bar (the player),
//  - open the bar from elsewhere ("Talk to Bro", prompt chips), with context,
//  - tell the scroll-to-top button to step aside (Bro takes its corner).

/** A practice question on screen that Bro should help with (owner-checked on the server). */
export type BroQuestion = { attemptId: string; questionId: string; label: string };

export type BroOpenRequest = {
  /** "Ask Bro" on one question (results, marking). */
  question?: BroQuestion;
  /** Shown as Bro's first message, e.g. the weekly brief being discussed. */
  context?: string;
  /** Sent as the student's first message straight away, e.g. a prompt chip. */
  prompt?: string;
  /** Opens on a new chat instead of the latest one (Ctrl/⌘ Shift O). */
  newChat?: boolean;
};

type State = {
  hidden: boolean;
  bottomOffset: number;
  /** A Bro button is on the page (the scroll-to-top button steps aside). */
  broMounted: boolean;
  /** How many page-level Bro buttons are mounted; the site-wide one (GlobalBro) hides while any are. */
  pageButtons: number;
  globalMounted: boolean;
  /** The question the current page has open (the player's current question). */
  question: BroQuestion | null;
  /** The bar is open; `request` is what opened it (null = opened by the button). */
  open: boolean;
  request: BroOpenRequest | null;
};

let state: State = { hidden: false, bottomOffset: 0, broMounted: false, pageButtons: 0, globalMounted: false, question: null, open: false, request: null };
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

/** Pages call this with the question on screen (null for none); cleared when the page goes. */
export function useBroQuestion(q: BroQuestion | null) {
  const attemptId = q?.attemptId ?? null;
  const questionId = q?.questionId ?? null;
  const label = q?.label ?? null;
  useEffect(() => {
    set({ question: attemptId && questionId ? { attemptId, questionId, label: label ?? "This question" } : null });
    return () => set({ question: null });
  }, [attemptId, questionId, label]);
}

/** Called by BroButton while it is on the page; `global` for the site-wide one in the root layout. */
export function useBroMounted(global = false) {
  useEffect(() => {
    if (global) set({ globalMounted: true, broMounted: true });
    else set({ pageButtons: state.pageButtons + 1, broMounted: true });
    return () => {
      const next = global ? { globalMounted: false } : { pageButtons: Math.max(0, state.pageButtons - 1) };
      const any = (global ? false : state.globalMounted) || (global ? state.pageButtons > 0 : next.pageButtons! > 0);
      // Closing the bar only when the last button goes, so a page-level button taking over keeps it open.
      set({ ...next, broMounted: any, ...(any ? {} : { open: false, request: null }) });
    };
  }, [global]);
}

/** The bottom-right Bro button; BroBar flies its icon out from here when it opens. */
export const BRO_BUTTON_ICON_ID = "bro-button-icon";
