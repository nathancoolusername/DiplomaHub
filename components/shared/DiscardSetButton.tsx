"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { discardAttemptAction } from "@/app/practice/actions";
import { Dialog } from "./Dialog";
import { Spinner } from "@/components/spinner";

/** Trash button on an unfinished set: asks first, then deletes the attempt (and an unsaved set). */
export function DiscardSetButton({ attemptId, title }: { attemptId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const discard = () =>
    start(async () => {
      try {
        await discardAttemptAction(attemptId);
        setOpen(false);
      } catch {
        setError("Couldn't delete it. Try again.");
      }
    });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label={`Delete ${title}`}
        className="shrink-0 p-xs rounded-lg text-on-surface-variant hover:text-error cursor-pointer"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
      {open && (
        <Dialog
          title="Delete this set?"
          onClose={() => !pending && setOpen(false)}
          width="max-w-100"
          footer={
            <>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={discard}
                disabled={pending}
                className="inline-flex items-center justify-center gap-xs rounded-lg bg-error text-on-error px-md py-sm text-label-md font-semibold hover:bg-error/90 disabled:opacity-60 cursor-pointer"
              >
                {pending && <Spinner size={14} />}
                {pending ? "Deleting…" : "Delete"}
              </button>
            </>
          }
        >
          <p className="text-body-md text-on-surface-variant">
            Your answers so far in “{title}” will be deleted. This can&apos;t be undone. If the set is in My sets, it stays there.
          </p>
          {error && <p className="mt-sm text-label-sm text-error">{error}</p>}
        </Dialog>
      )}
    </>
  );
}
