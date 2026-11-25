"use client";

import { useEffect, useState } from "react";
import { Flag, Timer } from "lucide-react";
import { BY_CODE, flagSrc } from "@/lib/flags/countries";
import { formatTime } from "@/lib/flags/engine";
import type { FlagsSummary, RoomActions } from "@/lib/deadline/types";

/**
 * Flags mode's end screen extra: how long the game took, how many flags were
 * shown, and the flags nobody named (each with its country, so it's a little
 * revision). Fetched once per game.
 */
export function FlagsResult({ gameNo, actions }: { gameNo: number; actions: Pick<RoomActions, "flagsSummary"> }) {
  const [s, setS] = useState<FlagsSummary | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let off = false;
    actions
      .flagsSummary()
      .then((r) => !off && (r ? setS(r) : setFailed(true)))
      .catch(() => !off && setFailed(true));
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per game
  }, [gameNo]);

  if (failed) return null;
  if (!s) return <p className="text-label-md text-on-surface-variant">Counting the flags…</p>;
  const all = s.shown >= s.total;

  return (
    <section className="w-full max-w-[32rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-md flex flex-col gap-sm" aria-labelledby="dl-flags-result">
      <h3 id="dl-flags-result" className="inline-flex items-center justify-center gap-xs font-serif font-bold text-headline-md text-on-surface tabular-nums">
        <Timer size={20} className="text-primary" aria-hidden="true" />
        {all ? `All ${s.total} flags in ${formatTime(s.seconds)}` : `${s.shown} flag${s.shown === 1 ? "" : "s"} in ${formatTime(s.seconds)}`}
      </h3>
      {s.missed.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">Nobody missed a flag. Impressive.</p>
      ) : (
        <>
          <p className="inline-flex items-center justify-center gap-xs text-label-md font-semibold text-on-surface-variant">
            <Flag size={13} aria-hidden="true" /> Nobody got {s.missed.length === 1 ? "this one" : `these ${s.missed.length}`}
          </p>
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-sm">
            {s.missed.map((code) => {
              const name = BY_CODE.get(code)?.name ?? code;
              return (
                <li key={code} className="flex flex-col items-center gap-1 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static SVG */}
                  <img src={flagSrc(code)} alt={`Flag of ${name}`} loading="lazy" className="w-full aspect-[4/3] object-cover rounded-md border border-outline-variant" />
                  <span className="text-label-sm font-semibold text-on-surface text-center leading-tight break-words">{name}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
