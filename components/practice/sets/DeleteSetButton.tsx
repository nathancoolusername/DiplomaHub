"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteSetAction } from "@/app/practice/actions";
import { Dialog } from "@/components/shared/Dialog";

/**
 * Delete a set, after asking. A set with results only leaves My sets (its
 * results stay in Past sets); otherwise it's gone, with any unfinished attempt.
 */
export function DeleteSetButton({
  setId,
  title,
  variant = "icon",
  afterHref,
  onDone,
}: {
  setId: string;
  title: string;
  variant?: "icon" | "button";
  /** Where to go afterwards (the edit page leaves; My sets just refreshes). */
  afterHref?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const confirm = () =>
    start(async () => {
      try {
        await deleteSetAction(setId);
        setOpen(false);
        onDone?.();
        if (afterHref) router.push(afterHref);
        else router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't delete the set");
      }
    });

  return (
    <>
      {variant === "icon" ? (
        <button type="button" onClick={() => setOpen(true)} aria-label={`Delete ${title}`} className="shrink-0 p-xs rounded-lg text-on-surface-variant hover:text-error cursor-pointer">
          <Trash2 size={16} aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-xs rounded-lg px-md py-sm text-label-md font-semibold text-error hover:bg-error-container cursor-pointer"
        >
          <Trash2 size={14} aria-hidden="true" /> Delete set
        </button>
      )}
      {open && (
        <Dialog
          title="Delete this set?"
          onClose={() => !pending && setOpen(false)}
          width="max-w-100"
          footer={
            <>
              <button type="button" onClick={() => setOpen(false)} disabled={pending} className="rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={pending}
                className="rounded-lg bg-error text-on-error px-md py-sm text-label-md font-semibold hover:bg-error/90 disabled:opacity-60 cursor-pointer"
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
            </>
          }
        >
          <p className="text-body-md text-on-surface-variant">
            “{title}” will be deleted, along with any unfinished attempt. If you&apos;ve already finished it, your results stay in Past sets.
          </p>
          {error && <p className="mt-sm text-label-sm text-error">{error}</p>}
        </Dialog>
      )}
    </>
  );
}
