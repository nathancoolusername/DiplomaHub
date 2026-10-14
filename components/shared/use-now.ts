"use client";

import { useSyncExternalStore } from "react";

// The current time in the student's own timezone is only known in the
// browser, so time-dependent text renders on the client. Server render
// (and the first client render) get null, which keeps hydration matching.

let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Milliseconds since epoch, refreshed every 30 s; null during SSR/hydration. */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => null,
  );
}

/** Whole calendar days from today to `iso`, in the browser's timezone. */
export function calendarDaysUntil(iso: string, nowMs: number): number {
  const target = new Date(iso);
  const today = new Date(nowMs);
  const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86_400_000);
}
