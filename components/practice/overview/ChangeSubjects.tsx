"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Subject, UserSubject } from "@/lib/data/types";
import { setCoreSubjectsAction } from "@/app/practice/actions";
import { Dialog } from "@/components/shared/Dialog";
import { SubjectPicker, type SubjectPick } from "../SubjectPicker";

const SIX = 6;

/** "Change subjects": the Hub's picker, six subjects, each HL or SL. */
export function ChangeSubjects({ core, catalog, practiceIds = null }: { core: UserSubject[]; catalog: Subject[]; practiceIds?: string[] | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [picks, setPicks] = useState<SubjectPick[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, start] = useTransition();

  const openDialog = () => {
    setPicks(
      core.map((c) => ({
        subjectId: c.subject.id,
        level: c.level,
        ...(c.subject.id.startsWith("custom:") ? { name: c.subject.name } : {}),
      })),
    );
    setError(null);
    setOpen(true);
  };

  const hlCount = picks.filter((p) => p.level === "HL").length;

  const save = () =>
    start(async () => {
      try {
        await setCoreSubjectsAction(picks);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't save your subjects");
      }
    });

  return (
    <>
      <button type="button" onClick={openDialog} className="text-label-md font-semibold text-primary hover:underline cursor-pointer">
        Change subjects
      </button>
      {open && (
        <Dialog
          title="Pick your subjects"
          onClose={() => setOpen(false)}
          width="max-w-160"
          footer={
            <>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || picks.length !== SIX}
                className="rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving…" : picks.length === SIX ? "Save" : `Pick ${SIX - picks.length} more`}
              </button>
            </>
          }
        >
          <p className="text-body-md text-on-surface-variant mb-md">
            Choose the six subjects you take for the diploma. Practise anything else under Extra classes.
          </p>
          <SubjectPicker catalog={catalog} value={picks} onChange={setPicks} max={SIX} practiceIds={practiceIds} />
          {picks.length === SIX && hlCount !== 3 && hlCount !== 4 && (
            <p className="mt-md text-label-md text-on-tertiary-container bg-tertiary-container rounded-lg px-md py-sm">
              Most IB students take three or four subjects at HL. You have {hlCount}.
            </p>
          )}
          {error && <p className="mt-sm text-label-md text-error">{error}</p>}
        </Dialog>
      )}
    </>
  );
}
