"use client";

import { useEffect, useSyncExternalStore } from "react";

// Whether the setup wizard is on screen, so other prompts (the Midnight tip)
// can wait instead of stacking on top of it.

let open = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Called by the wizard while it's mounted. */
export function useMarkOnboardingOpen() {
  useEffect(() => {
    open += 1;
    emit();
    return () => {
      open -= 1;
      emit();
    };
  }, []);
}

export function useOnboardingOpen(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open > 0,
    () => false,
  );
}
