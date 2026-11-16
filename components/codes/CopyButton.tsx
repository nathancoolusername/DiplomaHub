"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies `text`; shows a tick for two seconds. */
export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  className = "inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary cursor-pointer",
  iconOnly = false,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => setCopied(true));
      }}
      className={className}
      aria-label={iconOnly ? (copied ? copiedLabel : label) : undefined}
      title={iconOnly ? label : undefined}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      {!iconOnly && <span aria-live="polite">{copied ? copiedLabel : label}</span>}
    </button>
  );
}
