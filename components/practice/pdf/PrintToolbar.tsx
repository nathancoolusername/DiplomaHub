"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, Printer } from "lucide-react";

/** On screen only: back, and Print / Save as PDF. `auto` opens the print dialog once the page (and its maths) has loaded. */
export function PrintToolbar({ backHref, auto }: { backHref: string; auto: boolean }) {
  useEffect(() => {
    if (!auto) return;
    // Fonts first, so the PDF isn't saved with fallback fonts.
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      window.print();
    };
    void document.fonts.ready.then(() => setTimeout(go, 300));
  }, [auto]);

  return (
    <div className="dh-print-hide sticky top-0 z-10 mb-lg flex items-center gap-sm rounded-2xl border border-outline-variant bg-surface-container-lowest px-md py-sm">
      <Link href={backHref} className="inline-flex items-center gap-xs text-label-md font-semibold text-on-surface-variant hover:text-primary">
        <ArrowLeft size={16} aria-hidden="true" /> Back
      </Link>
      <p className="hidden sm:block text-label-md text-on-surface-variant">In the print window, pick “Save as PDF” to download it.</p>
      <button
        type="button"
        onClick={() => window.print()}
        className="ml-auto inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 cursor-pointer"
      >
        <Printer size={16} aria-hidden="true" /> Print / Save as PDF
      </button>
    </div>
  );
}
