"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";

/** Modal shell: themed scrim, raised (frosted on Midnight) panel, Esc / backdrop to close. */
export function Dialog({
  title,
  onClose,
  children,
  footer,
  width = "max-w-140",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-md">
      <div className="absolute inset-0 bg-scrim/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full ${width} max-h-[90vh] flex flex-col rounded-2xl bg-surface-raised glass border border-outline-variant shadow-xl`}
      >
        <header className="flex items-center justify-between gap-md px-lg pt-lg pb-sm">
          <h2 id={titleId} className="font-serif font-bold text-headline-md text-on-surface">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-on-surface-variant hover:text-primary cursor-pointer">
            <X size={20} />
          </button>
        </header>
        <div className="px-lg pb-lg overflow-y-auto">{children}</div>
        {footer && <footer className="px-lg py-md border-t border-outline-variant flex justify-end gap-sm">{footer}</footer>}
      </div>
    </div>
  );
}
