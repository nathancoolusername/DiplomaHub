"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { links } from "@/lib/practice/links";
import { PRO_COMING_SOON } from "@/lib/plans";

/** The small "Pro" pill on locked features. */
export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-tertiary-container text-on-tertiary-container px-1.5 py-px text-[10px] font-bold uppercase tracking-wide leading-4 ${className}`}
    >
      {PRO_COMING_SOON ? "Soon" : "Pro"}
    </span>
  );
}

/**
 * The one upsell: every locked feature opens this same popover, so the
 * message and link stay consistent.
 */
export function UpgradePopover({
  feature,
  onClose,
  className = "",
  description = PRO_COMING_SOON
    ? "DiplomaPro isn't open yet. Join the waitlist and we'll email you when it is."
    : "Get Bro's feedback, explanations and study plans built around your tests.",
  extra,
}: {
  feature: string;
  onClose: () => void;
  className?: string;
  description?: string;
  /** Extra actions shown before the link to /pro (e.g. a Midnight preview). */
  extra?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="DiplomaPro"
      className={`z-50 w-72 rounded-xl border border-outline-variant bg-surface-raised glass shadow-xl p-md flex flex-col gap-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-sm">
        <p className="font-serif font-bold text-on-surface flex items-center gap-xs">
          <Sparkles size={16} className="text-primary" aria-hidden="true" />
          {feature} {PRO_COMING_SOON ? "is coming with" : "is part of"} DiplomaPro
        </p>
        <button type="button" onClick={onClose} aria-label="Close" className="text-on-surface-variant hover:text-primary cursor-pointer">
          <X size={16} />
        </button>
      </div>
      <p className="text-label-md text-on-surface-variant">{description}</p>
      <div className="flex flex-wrap items-center gap-sm">
      {extra}
      <Link
        href={links.plans()}
        className="rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90"
      >
        {PRO_COMING_SOON ? "Join the waitlist" : "See plans"}
      </Link>
      </div>
    </div>
  );
}

/**
 * Wraps a feature button: Pro users get the normal click; free users get
 * a Pro badge and the upgrade popover instead.
 */
export function ProGate({
  isPro,
  feature,
  onClick,
  children,
  className = "",
  disabled = false,
}: {
  isPro: boolean;
  feature: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        onClick={() => (isPro ? onClick() : setOpen(true))}
        className={`inline-flex items-center gap-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {children}
        {!isPro && <ProBadge />}
      </button>
      {open && <UpgradePopover feature={feature} onClose={() => setOpen(false)} className="absolute left-0 top-full mt-xs" />}
    </span>
  );
}
