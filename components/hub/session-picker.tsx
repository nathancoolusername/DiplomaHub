"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// IB exam sessions run twice a year — every real graduating cohort lands on
// one of these. Centered on the app's own "today" (2026-09), spanning one
// session back to two years out.
export const SESSION_OPTIONS = ["Nov 2026", "May 2027", "Nov 2027", "May 2028", "Nov 2028"];

export default function SessionPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1 text-secondary font-medium hover:text-primary transition-colors cursor-pointer"
      >
        Session: {value}
        <ChevronDown size={12} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-md z-100 min-w-32 overflow-hidden">
          {SESSION_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full text-left px-sm py-1.5 text-label-sm transition-colors hover:bg-surface-container cursor-pointer ${
                value === option ? "text-primary font-bold bg-surface-container" : "text-on-surface"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
