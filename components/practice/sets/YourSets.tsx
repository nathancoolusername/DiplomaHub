"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import type { PracticeSet } from "@/lib/data/types";
import { EnterCodeDialog, MySetsDialog } from "@/components/practice/build/SetDialogs";

/** Your sets page: My sets as a list (rename, PDF, schedule, share, delete, start) and Enter a code. */
export function YourSets({ sets, isPro }: { sets: PracticeSet[]; isPro: boolean }) {
  const [code, setCode] = useState(false);
  return (
    <section className="flex flex-col gap-md" aria-labelledby="my-sets">
      <div className="flex items-end justify-between gap-md flex-wrap">
        <h2 id="my-sets" className="font-serif font-bold text-headline-md text-on-surface">
          My sets
        </h2>
        <button
          type="button"
          onClick={() => setCode(true)}
          className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface hover:border-primary cursor-pointer"
        >
          <KeyRound size={14} aria-hidden="true" /> Enter a code
        </button>
      </div>
      <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant px-lg py-sm">
        <MySetsDialog inline sets={sets} isPro={isPro} onEnterCode={() => setCode(true)} />
      </div>
      {code && <EnterCodeDialog onClose={() => setCode(false)} />}
    </section>
  );
}
