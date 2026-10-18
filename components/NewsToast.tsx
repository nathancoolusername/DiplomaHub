"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, X } from "lucide-react";
import { useHintTurn } from "./shared/FirstTimeHint";
import { useViewerPrefs } from "./shared/use-is-pro";
import { useOnboardingOpen } from "./shared/onboarding-open";

/**
 * A one-time announcement ("Chemistry is here", from lib/announcements.ts) in
 * the bottom-left corner, away from the Bro button. Every signed-in student
 * gets each one once: it's saved to their account (dismissed_hints), waits
 * while the setup wizard is open, and goes first in the first-time tips queue.
 * Opening the page it points at counts as seeing it.
 */
const noop = () => () => {};
const seenKey = (id: string) => `dp-news-seen:${id}`;
function readSeen(id: string): boolean {
  try {
    return localStorage.getItem(seenKey(id)) === "1";
  } catch {
    return false;
  }
}

export function NewsToast() {
  const prefs = useViewerPrefs();
  const pathname = usePathname();
  const wizardOpen = useOnboardingOpen();
  const news = prefs?.news ?? null;
  const id = news?.id ?? "news-none";
  // Also kept in this browser, so it can't come back on every page if saving to the account fails.
  const seenHere = useSyncExternalStore(noop, () => readSeen(id), () => true);
  const { show, dismiss: dismissTurn } = useHintTurn(id, !!news && !wizardOpen && !seenHere);
  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(seenKey(id), "1");
    } catch {
      // the account still remembers it
    }
    dismissTurn();
  }, [id, dismissTurn]);

  const onTarget = !!news && (pathname === news.href || pathname.startsWith(`${news.href}/`));
  useEffect(() => {
    if (show && onTarget) dismiss();
  }, [show, onTarget, dismiss]);

  if (!show || !news || onTarget) return null;

  return (
    <div
      role="status"
      aria-labelledby="news-toast-title"
      className="fixed bottom-md left-md right-md sm:right-auto z-50 sm:w-80 rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl p-md flex flex-col gap-sm"
    >
      <div className="flex items-start justify-between gap-sm">
        <p id="news-toast-title" className="font-semibold flex items-center gap-xs">
          <Megaphone size={16} aria-hidden="true" /> {news.title}
        </p>
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="p-0.5 opacity-80 hover:opacity-100 cursor-pointer">
          <X size={16} />
        </button>
      </div>
      <p className="text-label-md opacity-90">{news.body}</p>
      <div className="flex justify-end gap-xs">
        <button type="button" onClick={dismiss} className="rounded-lg px-md py-xs text-label-md font-semibold opacity-90 hover:opacity-100 cursor-pointer">
          Not now
        </button>
        <Link
          href={news.href}
          onClick={dismiss}
          className="rounded-lg bg-inverse-on-surface/15 px-md py-xs text-label-md font-semibold hover:bg-inverse-on-surface/25"
        >
          {news.cta}
        </Link>
      </div>
    </div>
  );
}
