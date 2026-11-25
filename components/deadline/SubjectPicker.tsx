"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Flag, Flame } from "lucide-react";
import { FEW_PROMPTS, FLAGS_SUBJECT, subjectLabel } from "@/lib/deadline/config";
import type { RoomActions } from "@/lib/deadline/types";

/**
 * Which subjects the prompts come from. The host ticks one or more (none =
 * Mixed: every subject, the harder game); everyone else sees the choice.
 * Flags is a mode of its own: a flag each turn, name the country. Ticking it
 * unticks the rest, and ticking anything else unticks it.
 */
// The list barely changes: keep it between Lobby and End screen so the chips
// don't pop in again every game.
let cachedList: { subject: string; prompts: number }[] | null = null;
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

export function SubjectPicker({ chosen: confirmed, isHost, actions }: {
  chosen: string[];
  isHost: boolean;
  actions: Pick<RoomActions, "listSubjects" | "setSubjects">;
}) {
  const [list, setList] = useState(cachedList);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void actions.listSubjects().then((l) => { cachedList = l; if (!cancelled) setList(l); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once
  }, []);

  // The host's taps show at once (draft) and go to the server one save at a
  // time, always with the latest choice, so quick taps never fight or flash.
  const [draft, setDraft] = useState<string[] | null>(null);
  const queued = useRef<string[] | null>(null);
  const sending = useRef(false);
  const [settled, setSettled] = useState(0);
  useEffect(() => {
    // Saved: hand back to the room's state after a beat (it may arrive late).
    if (!draft || sending.current) return;
    const t = setTimeout(() => setDraft(null), sameSet(draft, confirmed) ? 0 : 1500);
    return () => clearTimeout(t);
  }, [draft, confirmed, settled]);
  const chosen = draft ?? confirmed;

  const mixed = chosen.length === 0;
  const flagsOnly = chosen.length === 1 && chosen[0] === FLAGS_SUBJECT;
  const total = mixed
    ? list?.filter((s) => s.subject !== FLAGS_SUBJECT).reduce((n, s) => n + s.prompts, 0) ?? 0
    : list?.filter((s) => chosen.includes(s.subject)).reduce((n, s) => n + s.prompts, 0) ?? 0;

  async function set(next: string[]) {
    if (!isHost) return;
    setDraft(next);
    setError(null);
    queued.current = next;
    if (sending.current) return;
    sending.current = true;
    try {
      while (queued.current) {
        const n = queued.current;
        queued.current = null;
        const r = await actions.setSubjects(n);
        if (!r.ok) {
          queued.current = null;
          setDraft(null);
          setError(r.reason === "playing" ? "You can change subjects between games." : r.reason === "flags_alone" ? "Flags is played on its own." : "Couldn't change the subjects.");
          break;
        }
      }
    } finally {
      sending.current = false;
      setSettled((x) => x + 1);
    }
  }
  const toggle = (s: string) => {
    if (chosen.includes(s)) return set(chosen.filter((x) => x !== s));
    // Flags is its own mode: it replaces the other subjects, and they replace it.
    if (s === FLAGS_SUBJECT) return set([FLAGS_SUBJECT]);
    return set([...chosen.filter((x) => x !== FLAGS_SUBJECT), s]);
  };

  if (!isHost) {
    return (
      <p className="text-body-md text-on-surface-variant">
        Prompts from:{" "}
        <strong className="text-on-surface">{mixed ? "Mixed (every subject)" : flagsOnly ? "Flags (name the country)" : chosen.map(subjectLabel).join(", ")}</strong>
        {mixed && <span className="ml-xs inline-flex items-center gap-0.5 rounded-full bg-error/10 text-error px-sm text-label-sm font-semibold align-middle"><Flame size={11} aria-hidden="true" />Harder</span>}
      </p>
    );
  }

  const chip = (on: boolean) =>
    `inline-flex items-center gap-xs rounded-full border px-sm py-1 text-label-md font-semibold transition-colors cursor-pointer ${
      on ? "bg-primary text-on-primary border-primary" : "border-outline-variant text-on-surface hover:border-primary"}`;

  return (
    <section className="w-full max-w-[36rem] flex flex-col gap-sm" aria-labelledby="dl-subjects">
      <h2 id="dl-subjects" className="text-label-md font-semibold text-on-surface-variant">Prompts from</h2>
      <div className="flex flex-wrap justify-center gap-xs" role="group" aria-label="Subjects">
        <button type="button" aria-pressed={mixed} onClick={() => set([])} className={chip(mixed)}>
          <Check size={14} aria-hidden="true" className={mixed ? "" : "opacity-0"} />Mixed
          <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 text-label-sm ${mixed ? "bg-on-primary/20" : "bg-error/10 text-error"}`}>
            <Flame size={11} aria-hidden="true" />Harder
          </span>
        </button>
        {(list ?? []).map((s) => {
          const on = chosen.includes(s.subject);
          return (
            <button key={s.subject} type="button" aria-pressed={on} onClick={() => toggle(s.subject)} className={chip(on)}>
              <Check size={14} aria-hidden="true" className={on ? "" : "opacity-0"} />
              {s.subject === FLAGS_SUBJECT && <Flag size={13} aria-hidden="true" />}
              {subjectLabel(s.subject)}
              <span className={`text-label-sm tabular-nums ${on ? "text-on-primary/80" : "text-on-surface-variant"}`}>{s.prompts}</span>
            </button>
          );
        })}
      </div>
      <p className="text-label-md text-on-surface-variant min-h-[2lh]">
        {mixed
          ? "Mixed draws from every IB subject: the hardest game. Tick subjects to play only those, or Flags for a flag each turn."
          : flagsOnly
            ? `Flags: a flag each turn, name the country before your deadline. ${total} flags, on their own.`
          : total < FEW_PROMPTS
            ? `Only ${total} prompt${total === 1 ? "" : "s"}: they'll repeat sooner. Tick more for a longer game.`
            : `${total} prompts. Tick or untick to change.`}
      </p>
      {error && <p className="text-label-md text-error">{error}</p>}
    </section>
  );
}
