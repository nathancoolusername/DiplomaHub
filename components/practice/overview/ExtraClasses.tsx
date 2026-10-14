"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { StrengthMap, Subject, UserSubject } from "@/lib/data/types";
import { addExtraClassAction, removeExtraClassAction } from "@/app/practice/actions";
import { Dialog } from "@/components/shared/Dialog";
import { SubjectPicker, type SubjectPick } from "../SubjectPicker";
import { subjectRequestKey } from "@/lib/data/request-key";
import { SubjectCard } from "./SubjectCard";

/** Subjects a student practises beyond their six, plus the "Add a class" card. */
export function ExtraClasses({
  extras,
  maps,
  catalog,
  taken,
  practiceIds = null,
  requests = [],
}: {
  extras: UserSubject[];
  maps: StrengthMap[];
  catalog: Subject[];
  /** Subject ids the student already takes (core or extra). */
  taken: string[];
  /** Subjects that have practice questions (null = unknown: assume all). */
  practiceIds?: string[] | null;
  /** Subject-request keys the student has already sent. */
  requests?: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<SubjectPick[]>([]);
  const [busy, start] = useTransition();

  const add = () =>
    start(async () => {
      if (!pick[0]) return;
      await addExtraClassAction(pick[0]);
      setOpen(false);
      router.refresh();
    });

  const remove = (id: string) =>
    start(async () => {
      await removeExtraClassAction(id);
      router.refresh();
    });

  const openDialog = () => {
    setPick([]);
    setOpen(true);
  };

  return (
    <section className="flex flex-col gap-md" aria-labelledby="extra-classes">
      <h2 id="extra-classes" className="font-serif font-bold text-headline-md text-on-surface">
        Extra classes
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-md">
        {extras.map((us) => (
          <div key={us.subject.id} className="relative">
            <SubjectCard us={us} map={maps.find((m) => m.subject.id === us.subject.id) ?? null} compact hasPractice={!practiceIds || practiceIds.includes(us.subject.id)} requested={requests.includes(subjectRequestKey(us.subject.id, us.subject.name))} />
            <button
              type="button"
              onClick={() => remove(us.subject.id)}
              disabled={busy}
              aria-label={`Remove ${us.subject.shortName}`}
              className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-[50%] bg-surface-raised border border-outline-variant text-on-surface-variant hover:text-error flex items-center justify-center cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={openDialog}
          disabled={busy}
          className={`rounded-2xl border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary flex flex-col items-center justify-center gap-xs p-md cursor-pointer disabled:opacity-50 ${
            extras.length === 0 ? "col-span-2 sm:col-span-3 lg:col-span-2 items-start text-left" : ""
          }`}
        >
          {extras.length === 0 && (
            <span className="text-body-md text-on-surface">Want to practise a subject you don&apos;t take?</span>
          )}
          <span className="inline-flex items-center gap-xs text-label-md font-semibold">
            <Plus size={16} aria-hidden="true" /> Add a class
          </span>
        </button>
      </div>

      {open && (
        <Dialog
          title="Add a class"
          onClose={() => setOpen(false)}
          width="max-w-160"
          footer={
            <>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer">
                Cancel
              </button>
              <button
                type="button"
                onClick={add}
                disabled={busy || pick.length === 0}
                className="rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {busy ? "Adding…" : "Add"}
              </button>
            </>
          }
        >
          <SubjectPicker catalog={catalog} value={pick} onChange={setPick} max={1} exclude={taken} practiceIds={practiceIds} />
        </Dialog>
      )}
    </section>
  );
}
