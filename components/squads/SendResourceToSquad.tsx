"use client";

import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import { SendToSquad } from "@/components/codes/SendToSquad";

/** On a resource page: a button that opens "Send to your squad" (it lands on the squad's shelf). */
export function SendResourceToSquad({ resourceId, size = 36, className = "" }: { resourceId: string; size?: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="Send to your squad" title="Send to your squad" className={className}>
        <Users size={size * 0.8} aria-hidden="true" />
      </button>
      {open && (
        <div role="dialog" aria-label="Send to your squad" className="absolute right-0 top-full mt-xs z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-outline-variant bg-surface-raised shadow-xl p-md">
          <SendToSquad resourceId={resourceId} bare />
        </div>
      )}
    </div>
  );
}
