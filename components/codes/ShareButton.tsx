"use client";

import { useState, useTransition } from "react";
import { Share2 } from "lucide-react";
import { createShareCodeAction } from "@/app/codes/actions";
import { Spinner } from "@/components/spinner";
import { ShareCodeDialog } from "./ShareCodeDialog";

/**
 * "Share" for a set or Hub item: makes its code the first time (the same one
 * after that) and opens the dialog with the code and link.
 */
export function ShareButton({
  type,
  targetId,
  title,
  variant = "button",
  className,
}: {
  type: "practice_set" | "hub_item";
  targetId: string;
  title: string;
  /** "icon": a small icon button, for rows and panels. */
  variant?: "button" | "icon";
  className?: string;
}) {
  const [shared, setShared] = useState<{ code: string; useCount: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const share = () => {
    setError(null);
    start(async () => {
      const r = await createShareCodeAction(type, targetId);
      if (!r.ok) return setError(r.error);
      setShared({ code: r.code, useCount: r.useCount });
      setOpen(true);
    });
  };

  const label = type === "practice_set" ? "Share this set" : "Share this item";
  const icon = busy ? <Spinner size={14} /> : <Share2 size={variant === "icon" ? 16 : 14} aria-hidden="true" />;

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={share}
          disabled={busy}
          aria-label={label}
          title={error ?? label}
          className={
            className ??
            "p-sm rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors disabled:opacity-60 cursor-pointer"
          }
        >
          {icon}
        </button>
      ) : (
        <button
          type="button"
          onClick={share}
          disabled={busy}
          className={
            className ??
            "inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary disabled:opacity-70 cursor-pointer"
          }
        >
          {icon} Share
        </button>
      )}
      {error && variant === "button" && (
        <span role="alert" className="text-label-sm text-error">
          {error}
        </span>
      )}
      {open && shared && (
        <ShareCodeDialog type={type} code={shared.code} useCount={shared.useCount} title={title} setId={type === "practice_set" ? targetId : undefined} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
