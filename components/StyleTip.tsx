"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, Lock, Palette, X } from "lucide-react";
import { ACCENTS, BACKDROPS, readStoredAppearance, storeAppearance, type Appearance } from "@/lib/appearance";
import { access } from "@/lib/plans";
import { setAppearanceAction } from "@/app/actions/viewer";
import { useHintTurn } from "./shared/FirstTimeHint";
import { useStoredAppearance } from "./shared/StylePicker";
import { useViewerPrefs } from "./shared/use-is-pro";
import { useOnboardingOpen } from "./shared/onboarding-open";

/**
 * The one-time "Make it yours" tip, pointing at the palette button in the
 * nav's theme picker (on phones, under the menu button). The accent colours
 * and backgrounds are right in the tip: tapping one changes the site at once
 * and saves it (backgrounds follow access("backgrounds")). Signed-in students who haven't
 * changed their accent get it once (saved to the account, hint id 'style',
 * migration 49); it waits while the setup wizard is open and takes its turn
 * before the Midnight tip.
 */
// Also kept in this browser, so the tip can't come back on every page if
// saving to the account fails (e.g. before migration 49 has run).
const SEEN_KEY = "dh-style-tip-seen";
const noop = () => () => {};
function readSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function StyleTip({ preview = false, arrowClass = "right-6" }: { preview?: boolean; arrowClass?: string }) {
  const prefs = useViewerPrefs();
  const wizardOpen = useOnboardingOpen();
  const seenHere = useSyncExternalStore(noop, readSeen, () => true);
  const turn = useHintTurn("style", !preview && prefs?.styleTip === true && !wizardOpen && !seenHere);
  // /dev/style-tip shows it without the queue or saving the dismissal.
  const [previewOpen, setPreviewOpen] = useState(true);
  const show = preview ? previewOpen : turn.show;
  const dismissTurn = turn.dismiss;
  const current = useStoredAppearance();
  const [lastName, setLastName] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const backgrounds = access("backgrounds", preview || prefs?.isPro === true).allowed;

  const dismiss = useCallback(() => {
    if (preview) return setPreviewOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // the account still remembers it
    }
    dismissTurn();
  }, [dismissTurn, preview]);

  if (!show) return null;

  const pick = (patch: Partial<Appearance>, name: string) => {
    if (patch.backdrop && patch.backdrop !== "plain" && !backgrounds) return setLocked(true);
    const next = { ...readStoredAppearance(), ...patch };
    storeAppearance(next);
    if (!preview) void setAppearanceAction(next).catch(() => {});
    setLastName(name);
    setLocked(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="style-tip-title"
      className="absolute right-0 top-full mt-sm z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-inverse-surface text-inverse-on-surface shadow-xl p-md flex flex-col gap-sm"
    >
      <span aria-hidden="true" className={`absolute -top-1.5 w-3 h-3 rotate-45 bg-inverse-surface ${arrowClass}`} />
      <div className="flex items-start justify-between gap-sm">
        <p id="style-tip-title" className="font-semibold flex items-center gap-xs">
          <Palette size={16} aria-hidden="true" /> {lastName ? `${lastName} it is` : "Make it yours"}
        </p>
        <button type="button" onClick={dismiss} aria-label="Close" className="p-0.5 opacity-80 hover:opacity-100 cursor-pointer">
          <X size={16} />
        </button>
      </div>
      <p className="text-label-md opacity-90">
        {lastName
          ? "Saved to your account. Change it any time from the palette button in the theme picker"
          : "Pick a colour and a background for the whole site. Tap to try them, and change them any time from the palette button in the theme picker"}
        <span className="lg:hidden"> in the menu</span>.
      </p>

      <p className="text-label-sm font-semibold opacity-80">Accent colour</p>
      <div role="radiogroup" aria-label="Accent colour" className="flex justify-between gap-xs">
        {ACCENTS.map((a) => {
          const on = current.accent === a.id;
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={a.name}
              title={a.name}
              onClick={() => pick({ accent: a.id }, a.name)}
              className={`w-8 h-8 rounded-[50%] flex items-center justify-center cursor-pointer ring-offset-2 ring-offset-inverse-surface transition-shadow ${
                on ? "ring-2 ring-inverse-on-surface" : "hover:ring-2 hover:ring-inverse-on-surface/50"
              }`}
              style={{ background: a.swatch }}
            >
              {on && <Check size={14} className="text-white" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <p className="text-label-sm font-semibold opacity-80 flex items-center gap-xs pt-xs">
        Background
        {!backgrounds && <span className="rounded-full bg-inverse-on-surface/15 px-1.5 font-normal">DiplomaPro</span>}
      </p>
      <div role="radiogroup" aria-label="Background" className="grid grid-cols-4 gap-xs">
        {BACKDROPS.map((b) => {
          const on = current.backdrop === b.id;
          const lockedHere = !backgrounds && b.id !== "plain";
          return (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={lockedHere ? `${b.name} (DiplomaPro)` : b.name}
              onClick={() => pick({ backdrop: b.id }, b.name)}
              className="flex flex-col items-center gap-0.5 cursor-pointer group"
            >
              <span
                className={`relative w-full h-9 rounded-lg flex items-center justify-center ring-offset-2 ring-offset-inverse-surface transition-shadow ${
                  on ? "ring-2 ring-inverse-on-surface" : "group-hover:ring-2 group-hover:ring-inverse-on-surface/50"
                }`}
                style={{ background: b.preview }}
              >
                {on && <Check size={14} className="text-black/70" aria-hidden="true" />}
                {lockedHere && <Lock size={12} className="text-black/60" aria-hidden="true" />}
              </span>
              <span className="text-[11px] leading-tight opacity-80">{b.name}</span>
            </button>
          );
        })}
      </div>
      {locked && (
        <p className="text-label-sm opacity-90">
          Backgrounds come with DiplomaPro.{" "}
          <Link href="/pro" onClick={dismiss} className="font-semibold underline">
            See DiplomaPro
          </Link>
        </p>
      )}

      <div className="flex justify-end pt-xs">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg bg-inverse-on-surface/15 px-md py-xs text-label-md font-semibold hover:bg-inverse-on-surface/25 cursor-pointer"
        >
          {lastName ? "Done" : "Not now"}
        </button>
      </div>
    </div>
  );
}
