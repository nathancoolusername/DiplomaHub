"use client";

import { useState, useTransition } from "react";
import { Check, Megaphone } from "lucide-react";
import type { Level, SubjectId } from "@/lib/data/types";
import { requestSubjectAction } from "@/app/practice/actions";
import { Spinner } from "@/components/spinner";

/** "Request this subject": tells us which subjects students need practice for. */
export function RequestSubjectButton({
  subjectId,
  level,
  requested,
  className = "",
}: {
  subjectId: SubjectId;
  level: Level;
  requested: boolean;
  className?: string;
}) {
  const [done, setDone] = useState(requested);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <span className={`inline-flex items-center gap-xs text-label-md font-semibold text-secondary ${className}`}>
        <Check size={14} aria-hidden="true" /> Requested, thanks
      </span>
    );
  }
  return (
    <span className={`inline-flex flex-col items-start gap-xs ${className}`}>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            try {
              await requestSubjectAction(subjectId, level);
              setDone(true);
            } catch {
              setError("Couldn't send that. Try again.");
            }
          })
        }
        className="inline-flex items-center gap-xs rounded-lg border border-primary text-primary px-md py-xs text-label-md font-semibold hover:bg-primary-fixed disabled:opacity-60 cursor-pointer"
      >
        {pending ? <Spinner size={14} /> : <Megaphone size={14} aria-hidden="true" />} {pending ? "Sending…" : "Request this subject"}
      </button>
      {error && (
        <span role="alert" className="text-label-sm text-error">
          {error}
        </span>
      )}
    </span>
  );
}
