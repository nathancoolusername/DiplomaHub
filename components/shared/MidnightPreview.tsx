"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { Sparkles } from "lucide-react";
import { midnightPreview, switchTheme } from "./theme-transition";

export const MIDNIGHT_PREVIEW_MS = 3000;

/**
 * "Preview for 3 s": animates into Midnight, shows a countdown pill, then
 * animates back to whatever theme was active. Used on Home and in the
 * Free vs DiplomaPro table.
 */
export function MidnightPreviewButton({
  className,
  onStart,
  onDone,
  label = "Preview for 3 s",
}: {
  className: string;
  onStart?: () => void;
  onDone?: () => void;
  label?: string;
}) {
  const { theme, setTheme } = useTheme();
  const [previewing, setPreviewing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // What to restore if this button goes away mid-preview (popover closed, page left).
  const restore = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      restore.current?.();
      midnightPreview.active = false;
    },
    [],
  );

  const preview = () => {
    const before = theme ?? "system";
    setPreviewing(true);
    onStart?.();
    midnightPreview.active = true;
    restore.current = () => setTheme(before);
    void switchTheme(setTheme, "midnight");
    timer.current = setTimeout(() => {
      timer.current = null;
      restore.current = null;
      void switchTheme(setTheme, before).then(() => {
        midnightPreview.active = false;
        setPreviewing(false);
        onDone?.();
      });
    }, MIDNIGHT_PREVIEW_MS);
  };

  return (
    <>
      <button type="button" onClick={preview} disabled={previewing} className={className}>
        {label}
      </button>
      {previewing &&
        createPortal(
          <div
            role="status"
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] rounded-full bg-surface-raised glass border border-outline-variant shadow-xl px-md py-xs flex items-center gap-sm overflow-hidden"
          >
            <Sparkles size={14} className="text-primary" aria-hidden="true" />
            <span className="text-label-md font-semibold text-on-surface">Midnight preview</span>
            <span className="absolute bottom-0 left-0 h-0.5 bg-primary midnight-countdown" aria-hidden="true" />
          </div>,
          document.body,
        )}
    </>
  );
}
