"use client";

import { useState, useTransition } from "react";
import { createHubSetFromImport } from "@/app/lib/actions/hub-sets";
import { Dialog } from "@/components/shared/Dialog";
import { Spinner } from "@/components/spinner";

/** "Make these a set?" after a calendar import: names the imported items as one Hub set. */
export function ImportSetDialog({ batchId, count, onClose }: { batchId: string; count: number; onClose: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, start] = useTransition();

  const save = () =>
    start(async () => {
      setError(null);
      const r = await createHubSetFromImport(name, batchId);
      if (!r.success) return setError(r.error);
      setDone(`"${r.data.name}" is a set with ${r.data.count} item${r.data.count === 1 ? "" : "s"}. Find it under Sets.`);
    });

  return (
    <Dialog
      title={done ? "Set made" : "Make these a set?"}
      onClose={onClose}
      width="max-w-120"
      footer={
        done ? (
          <button type="button" onClick={onClose} className="rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold cursor-pointer">
            Done
          </button>
        ) : (
          <>
            <button type="button" onClick={onClose} className="rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer">
              Not now
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy || !name.trim()}
              className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold disabled:opacity-50 cursor-pointer"
            >
              {busy && <Spinner size={14} />} Make a set
            </button>
          </>
        )
      }
    >
      {done ? (
        <p className="text-body-md text-on-surface">{done}</p>
      ) : (
        <div className="flex flex-col gap-md">
          <p className="text-body-md text-on-surface-variant">
            Keep the {count} items you just imported together, like your mock timetable. You can share the set as a code later.
          </p>
          <label className="flex flex-col gap-xs">
            <span className="text-label-md font-semibold text-on-surface-variant">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoFocus
              placeholder="e.g. Mocks timetable"
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-xs text-body-md text-on-surface"
            />
          </label>
          {error && (
            <p role="alert" className="text-label-md text-error">
              {error}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
