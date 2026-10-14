"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Sparkles, X } from "lucide-react";
import { links } from "@/lib/practice/links";
import { access, PRO_COMING_SOON } from "@/lib/plans";
import { switchTheme } from "@/components/shared/theme-transition";
import { MidnightPreviewButton } from "@/components/shared/MidnightPreview";

const DISMISS_KEY = "dp-midnight-promo-dismissed";

const noop = () => () => {};

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

const cta = "rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-bold hover:opacity-90 disabled:opacity-60 cursor-pointer";

/**
 * Midnight on Home. Free: a 3-second preview, then the upgrade link.
 * Pro: the one-time "Try Midnight" prompt.
 */
export function MidnightPromo({ isPro: viewerIsPro }: { isPro: boolean }) {
  // Free for everyone while DiplomaPro is coming soon (lib/plans.ts).
  const isPro = access("midnight_theme", viewerIsPro).allowed;
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const storedDismissed = useSyncExternalStore(noop, readDismissed, () => true);
  const [dismissed, setDismissed] = useState(false);
  const [previewed, setPreviewed] = useState(false);

  if (!mounted || dismissed || storedDismissed) return null;
  // Pro students already on Midnight don't need the prompt.
  if (isPro && theme === "midnight") return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // not remembered across visits; fine
    }
  };

  return (
    // data-theme="midnight" scopes Midnight's tokens to this card, so it
    // shows the Midnight look whatever theme is active.
    <section
      data-theme="midnight"
      className="midnight-surface relative overflow-hidden rounded-2xl p-lg flex flex-wrap items-center gap-md text-on-surface"
      aria-labelledby="midnight-promo"
    >
      <div className="flex-1 min-w-60 flex flex-col gap-xs">
        <h2 id="midnight-promo" className="font-serif font-bold text-body-lg flex items-center gap-sm">
          <Sparkles size={16} className="text-primary" aria-hidden="true" /> Midnight
        </h2>
        <p className="text-body-md text-on-surface-variant">
          {isPro
            ? (PRO_COMING_SOON ? "Free for now: deep navy, frosted cards and ice-blue accents." : "Your DiplomaPro theme: deep navy, frosted cards and ice-blue accents.")
            : previewed
              ? "Like it? Midnight comes with DiplomaPro."
              : "A calm, deep-navy theme that comes with DiplomaPro."}
        </p>
      </div>
      <div className="flex items-center gap-sm">
        {isPro ? (
          <button
            type="button"
            onClick={() => {
              void switchTheme(setTheme, "midnight");
              dismiss();
            }}
            className={cta}
          >
            Switch to Midnight
          </button>
        ) : previewed ? (
          <Link href={links.plans()} className={cta}>
            Get DiplomaPro
          </Link>
        ) : (
          <MidnightPreviewButton className={cta} onDone={() => setPreviewed(true)} />
        )}
        <button type="button" onClick={dismiss} aria-label={isPro ? "Not now" : "Hide"} className="p-xs text-on-surface-variant hover:text-on-surface cursor-pointer">
          <X size={16} />
        </button>
      </div>
    </section>
  );
}
