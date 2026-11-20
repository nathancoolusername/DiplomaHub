"use client";

import { useEffect, useState } from "react";
import { Check, Flame } from "lucide-react";
import { FEW_PROMPTS, subjectLabel } from "@/lib/deadline/config";
import type { RoomActions } from "@/lib/deadline/types";

/**
 * Which subjects the prompts come from. The host ticks one or more (none =
 * Mixed: every subject, the harder game); everyone else sees the choice.
 */
export function SubjectPicker({ chosen, isHost, actions }: {
  chosen: string[];
  isHost: boolean;
  actions: Pick<RoomActions, "listSubjects" | "setSubjects">;
}) {
  const [list, setList] = useState<{ subject: string; prompts: number }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void actions.listSubjects().then((l) => { if (!cancelled) setList(l); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once
  }, []);

  const mixed = chosen.length === 0;
  const total = mixed ? list?.reduce((n, s) => n + s.prompts, 0) ?? 0 : list?.filter((s) => chosen.includes(s.subject)).reduce((n, s) => n + s.prompts, 0) ?? 0;

  async function set(next: string[]) {
    if (!isHost || busy) return;
    setBusy(true);
    setError(null);
    const r = await actions.setSubjects(next);
    setBusy(false);
    if (!r.ok) setError(r.reason === "playing" ? "You can change subjects between games." : "Couldn't change the subjects.");
  }
  const toggle = (s: string) => set(chosen.includes(s) ? chosen.filter((x) => x !== s) : [...chosen, s]);

  if (!isHost) {
    return (
      <p className="text-body-md text-on-surface-variant">
        Prompts from:{" "}
        <strong className="text-on-surface">{mixed ? "Mixed (every subject)" : chosen.map(subjectLabel).join(", ")}</strong>
        {mixed && <span className="ml-xs inline-flex items-center gap-0.5 rounded-full bg-error/10 text-error px-sm text-label-sm font-semibold align-middle"><Flame size={11} aria-hidden="true" />Harder</span>}
      </p>
    );
  }

  const chip = (on: boolean) =>
    `inline-flex items-center gap-xs rounded-full border px-sm py-1 text-label-md font-semibold transition-colors disabled:opacity-60 cursor-pointer ${
      on ? "bg-primary text-on-primary border-primary" : "border-outline-variant text-on-surface hover:border-primary"}`;

  return (
    <section className="w-full max-w-[36rem] flex flex-col gap-sm" aria-labelledby="dl-subjects">
      <h2 id="dl-subjects" className="text-label-md font-semibold text-on-surface-variant">Prompts from</h2>
      <div className="flex flex-wrap justify-center gap-xs" role="group" aria-label="Subjects">
        <button type="button" aria-pressed={mixed} disabled={busy} onClick={() => set([])} className={chip(mixed)}>
          {mixed && <Check size={14} aria-hidden="true" />}Mixed
          <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 text-label-sm ${mixed ? "bg-on-primary/20" : "bg-error/10 text-error"}`}>
            <Flame size={11} aria-hidden="true" />Harder
          </span>
        </button>
        {(list ?? []).map((s) => {
          const on = chosen.includes(s.subject);
          return (
            <button key={s.subject} type="button" aria-pressed={on} disabled={busy} onClick={() => toggle(s.subject)} className={chip(on)}>
              {on && <Check size={14} aria-hidden="true" />}
              {subjectLabel(s.subject)}
              <span className={`text-label-sm tabular-nums ${on ? "text-on-primary/80" : "text-on-surface-variant"}`}>{s.prompts}</span>
            </button>
          );
        })}
      </div>
      <p className="text-label-md text-on-surface-variant">
        {mixed
          ? "Mixed draws from every subject: the hardest game. Tick subjects to play only those."
          : total < FEW_PROMPTS
            ? `Only ${total} prompt${total === 1 ? "" : "s"}: they'll repeat sooner. Tick more for a longer game.`
            : `${total} prompts. Tick or untick to change.`}
      </p>
      {error && <p className="text-label-md text-error">{error}</p>}
    </section>
  );
}
