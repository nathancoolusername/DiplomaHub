"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { FORTY_FIVE } from "@/lib/forty-five/config";
import type { ArchiveEntry } from "@/lib/forty-five/server";
import type { PlayView } from "@/lib/forty-five/types";
import { dayLabel } from "@/lib/forty-five/dates";

type Result = ArchiveEntry["result"];

/** Past puzzles, newest first. Signed in: results come from the server; guests: from this browser's saved games. */
export function ArchiveList({ entries, signedIn }: { entries: ArchiveEntry[]; signedIn: boolean }) {
  const [guest, setGuest] = useState<Map<string, Result>>(new Map());

  useEffect(() => {
    if (signedIn) return;
    const m = new Map<string, Result>();
    for (const e of entries) {
      try {
        const save = JSON.parse(localStorage.getItem(`forty-five:${e.puzzleId}`) ?? "null") as { play?: PlayView } | null;
        if (save?.play) m.set(e.puzzleId, { finished: save.play.finished, score: save.play.score, won: save.play.won, counted: false });
      } catch {}
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading this browser's saved games after mount
    setGuest(m);
  }, [entries, signedIn]);

  const played = entries.filter((e) => (signedIn ? e.result : guest.get(e.puzzleId))?.finished).length;

  return (
    <div className="flex flex-col gap-sm">
      <p className="text-label-md text-on-surface-variant text-center">
        {played} of {entries.length} played
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-xs">
        {entries.map((e) => {
          const r = signedIn ? e.result : (guest.get(e.puzzleId) ?? null);
          return (
            <li key={e.puzzleId}>
              <Link
                href={`/forty-five/archive/${e.number}`}
                className="flex items-center gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest px-md py-sm hover:border-primary transition-colors"
              >
                <span className="font-serif font-bold text-body-lg text-on-surface tabular-nums w-12">#{e.number}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-body-md font-semibold text-on-surface">{dayLabel(e.date)}</span>
                  <span className="block text-label-sm text-on-surface-variant">
                    {!r ? "Not played" : !r.finished ? "In progress" : r.won ? (r.counted ? "Solved on the day" : "Solved") : r.counted ? "Out of lives on the day" : "Out of lives"}
                  </span>
                </span>
                {r?.finished ? (
                  <span className={`tabular-nums font-semibold text-body-md ${r.won ? "text-primary" : "text-on-surface-variant"}`}>
                    {r.score ?? 0}
                    <span className="text-label-sm text-on-surface-variant">/{FORTY_FIVE.startScore}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center text-label-md font-semibold text-primary">
                    {r ? "Resume" : "Play"} <ChevronRight size={16} aria-hidden="true" />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
