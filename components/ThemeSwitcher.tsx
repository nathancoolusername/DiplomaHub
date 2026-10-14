"use client";

import { useTheme } from "next-themes";
import { useState, useSyncExternalStore } from "react";
import { Monitor, Moon, Sparkles, Sun } from "lucide-react";
import { switchTheme } from "./shared/theme-transition";
import { setThemeAction } from "@/app/actions/viewer";
import { loadViewerPrefs, useIsPro } from "./shared/use-is-pro";
import { UpgradePopover } from "./shared/ProUpsell";
import { MidnightPreviewButton } from "./shared/MidnightPreview";
import { access } from "@/lib/plans";

// Theme picker in the nav: System, Light, Dark and Midnight. Midnight is a
// DiplomaPro theme (lib/plans.ts "midnight_theme"): everyone sees it, but
// for free users it opens the upsell with a 3-second preview instead.
// While Pro is coming soon, access() makes it free for everyone.
const OPTIONS = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "midnight", label: "Midnight", Icon: Sparkles },
] as const;

const subscribe = () => () => {};

export function ThemeSwitcher({ popoverAlign = "right" }: { popoverAlign?: "left" | "right" }) {
  const { theme, setTheme } = useTheme();
  // The saved theme is only known on the client; render a neutral state on
  // the server so hydration matches.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const isPro = useIsPro();
  const hasMidnight = access("midnight_theme", isPro === true).allowed;
  // Highlight the pressed option immediately, before the animated switch.
  const [pressed, setPressed] = useState<string | null>(null);
  const [upsell, setUpsell] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const current = pressed ?? theme;

  const choose = (value: string) => {
    if (value === "midnight" && !hasMidnight) {
      setUpsell(true);
      return;
    }
    setPressed(value);
    void switchTheme(setTheme, value).then(() => setPressed(null));
    // Saved to the account so it follows them to other devices (signed-in only).
    void loadViewerPrefs().then((p) => {
      if (p.signedIn) void setThemeAction(value as "system" | "light" | "dark" | "midnight").catch(() => {});
    });
  };

  return (
    <div className="relative">
      <div
        role="radiogroup"
        aria-label="Theme"
        className="flex items-center gap-0.5 p-0.5 rounded-full border border-outline-variant bg-surface-container-low"
      >
        {OPTIONS.map(({ value, label, Icon }) => {
          const active = mounted && current === value;
          const locked = value === "midnight" && isPro === false && !hasMidnight;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={locked ? `${label} (DiplomaPro)` : label}
              title={locked ? `${label} · DiplomaPro` : label}
              onClick={() => choose(value)}
              className={`relative p-1.5 rounded-[50%] cursor-pointer transition-colors ${
                active ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              <Icon size={14} aria-hidden="true" />
              {locked && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-[50%] bg-tertiary" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {upsell && (
        <UpgradePopover
          feature="Midnight"
          description="A calm, deep-navy theme with frosted cards and ice-blue accents."
          // Stays open while the preview runs, so it can switch back.
          onClose={() => !previewing && setUpsell(false)}
          className={`absolute top-full mt-sm ${popoverAlign === "right" ? "right-0" : "left-0"}`}
          extra={
            <MidnightPreviewButton
              onStart={() => setPreviewing(true)}
              onDone={() => setPreviewing(false)}
              className="rounded-lg border border-primary text-primary px-md py-xs text-label-md font-semibold hover:bg-primary-fixed disabled:opacity-60 cursor-pointer"
            />
          }
        />
      )}
    </div>
  );
}
