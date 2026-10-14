"use client";

import { useEffect } from "react";
import { DiplomaBroMark } from "./DiplomaBroIcon";
import { ProBadge, UpgradePopover } from "../ProUpsell";
import { BroBar } from "./BroBar";
import { FirstTimeHint } from "../FirstTimeHint";
import { BRO_BUTTON_ICON_ID, closeBro, toggleBro, useBroMounted, useBroPlacement } from "./bro-visibility";

/**
 * Fixed bottom-right on every signed-in page (in place of scroll-to-top). Click or Ctrl/Cmd+K opens the
 * command bar (Pro). Free users get a Pro badge and the upgrade popover.
 * Hidden during timed sets.
 */
export function BroButton({ isPro, hintPending = false }: { isPro: boolean; hintPending?: boolean }) {
  // Open/closed lives in the shared store so "Talk to Bro" elsewhere can open it.
  const { hidden, bottomOffset, open, request } = useBroPlacement();
  useBroMounted();

  useEffect(() => {
    if (hidden) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleBro();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hidden]);

  if (hidden) return null;

  return (
    <>
      <div className="fixed right-6 z-40" style={{ bottom: 24 + bottomOffset }}>
        {open && !isPro && <UpgradePopover feature="DiplomaBro" onClose={closeBro} className="absolute bottom-full mb-sm right-0" />}
        <FirstTimeHint
          id="bro-button"
          pending={hintPending}
          text={
            isPro
              ? "This is DiplomaBro. Ask it to plan your week, explain a question or build a set. Shortcut: Ctrl/⌘ K."
              : "DiplomaBro is your study partner, coming with DiplomaPro: explanations, answer checks and study plans around your tests."
          }
        >
          {/* While the bar is open the icon has "flown" into it (BroBar), so this one hides and pops back on close. */}
          <button
            id={BRO_BUTTON_ICON_ID}
            type="button"
            onClick={toggleBro}
            aria-label={isPro ? "Ask Bro (Ctrl+K)" : "DiplomaBro (coming soon)"}
            aria-expanded={open}
            className={`relative w-14 h-14 rounded-[50%] shadow-lg cursor-pointer transition-[transform,opacity] duration-200 ease-out hover:scale-105 motion-reduce:transition-none ${
              open && isPro ? "opacity-0 scale-50 pointer-events-none" : "opacity-100 scale-100"
            }`}
          >
            <DiplomaBroMark size={56} state={!isPro ? "locked" : hintPending ? "notification" : "idle"} />
            {!isPro && <ProBadge className="absolute -top-1 -left-2" />}
          </button>
        </FirstTimeHint>
      </div>
      {/* Keyed by request so each "Talk to Bro" starts a fresh conversation view. */}
      {open && isPro && <BroBar key={JSON.stringify(request)} onClose={closeBro} request={request} />}
    </>
  );
}
