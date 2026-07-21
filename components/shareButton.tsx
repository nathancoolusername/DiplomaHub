"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export function ShareButton({
  className,
  size = 30,
}: {
  className?: string;
  size?: number;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (insecure context, denied permission) —
      // nothing useful to do beyond not showing the "Copied" pill.
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        className={
          className ??
          "rounded-xl transition hover:text-primary hover:bg-surface-container cursor-pointer p-sm"
        }
      >
        <Share2 size={size} />
      </button>
      {copied && (
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-secondary-container text-secondary text-label-sm font-semibold px-md py-1 rounded-full shadow-md">
          Copied!
        </span>
      )}
    </div>
  );
}
