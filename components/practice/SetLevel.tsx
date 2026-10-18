"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/spinner";
import type { Level, SubjectId } from "@/lib/data/types";
import { setSubjectLevelAction } from "@/app/practice/actions";

/**
 * HL/SL for a subject that came from the Hub without one. Shows "Set level";
 * a tap opens HL / SL, which saves straight away. Until then the subject is
 * treated as SL, so this is the student's chance to correct it.
 */
export function SetLevel({ subjectId, className = "" }: { subjectId: SubjectId; className?: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<Level | null>(null);
  const [error, setError] = useState(false);
  const [, start] = useTransition();

  const save = (level: Level) => {
    setSaving(level);
    setError(false);
    start(async () => {
      try {
        await setSubjectLevelAction(subjectId, level);
      } catch {
        setError(true);
      }
      setSaving(null);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`shrink-0 rounded-full border border-dashed border-primary text-primary px-sm py-px text-label-sm font-bold hover:bg-primary-fixed cursor-pointer ${className}`}
      >
        Set level
      </button>
    );
  }
  return (
    <span className={`shrink-0 inline-flex flex-col items-end gap-xs ${className}`}>
      <span role="group" aria-label="Level" className="inline-flex rounded-full border border-primary overflow-hidden text-label-sm font-bold">
        {(["HL", "SL"] as const).map((l) => (
          <button
            key={l}
            type="button"
            disabled={saving !== null}
            onClick={() => save(l)}
            className="inline-flex items-center gap-1 px-sm py-px text-primary hover:bg-primary hover:text-on-primary disabled:opacity-60 cursor-pointer first:border-r first:border-primary"
          >
            {saving === l && <Spinner size={12} />}
            {l}
          </button>
        ))}
      </span>
      {error && <span className="text-label-sm text-error">Couldn&apos;t save. Try again.</span>}
    </span>
  );
}
