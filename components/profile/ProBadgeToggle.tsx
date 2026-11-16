"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/shared/Switch";
import { setProBadgeHiddenAction } from "@/app/profile/edit/actions";

/** "Hide my Pro badge": you keep Pro; other people just don't see the badge. */
export function ProBadgeToggle({ hidden, until }: { hidden: boolean; until: string }) {
  const [on, setOn] = useState(hidden);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="flex flex-col gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest p-md">
      <div>
        <h2 className="font-serif font-semibold text-headline-sm text-on-surface">DiplomaPro</h2>
        <p className="text-body-md text-on-surface-variant">{until}</p>
      </div>
      <Switch
        checked={on}
        onChange={(next) => {
          setOn(next);
          setError(null);
          start(async () => {
            try {
              await setProBadgeHiddenAction(next);
            } catch {
              setOn(!next);
              setError("Couldn't save that. Try again.");
            }
          });
        }}
        label={pending ? "Saving…" : "Hide my Pro badge from other people"}
      />
      {error && <p className="text-label-sm text-error">{error}</p>}
    </section>
  );
}
