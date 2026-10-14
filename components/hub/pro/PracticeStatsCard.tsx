"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import type { PracticeStats } from "@/lib/data/types";

/** A "nice" axis max (1, 2, 5 × 10ⁿ) at or above the data max, so ticks read cleanly. */
function niceMax(n: number): number {
  if (n <= 5) return 5;
  const pow = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 5, 10].find((m) => m * pow >= n) ?? 10;
  return step * pow;
}

/** "45 min" under an hour, then "6.2 h". */
function compactTime(seconds: number): string {
  const min = Math.round(seconds / 60);
  return min < 60 ? `${min} min` : `${Math.round((min / 60) * 10) / 10} h`;
}

function dayLabel(iso: string, style: "short" | "long") {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return style === "short"
    ? date.toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

/**
 * "Your practice": questions answered per day over the last 14 days (one
 * series, so no legend — the title names it), plus accuracy and time.
 */
export function PracticeStatsCard({ stats }: { stats: PracticeStats }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...stats.days.map((d) => d.answered)));
  const empty = stats.answered === 0;
  const ticks = [max, max / 2, 0];

  return (
    <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md" aria-labelledby="your-practice">
      <div className="flex items-baseline justify-between gap-sm">
        <h2 id="your-practice" className="font-serif font-bold text-body-lg text-on-surface flex items-center gap-sm">
          <BarChart3 size={18} className="text-primary" aria-hidden="true" /> Your practice
        </h2>
        <span className="text-label-sm text-on-surface-variant">Questions per day · 14 days</span>
      </div>

      {/* Chart */}
      <div className="relative flex gap-sm h-40" aria-hidden="true">
        {/* y axis */}
        <div className="flex flex-col justify-between text-[11px] text-on-surface-variant tabular-nums text-right w-6 -my-1.5">
          {ticks.map((t) => (
            <span key={t}>{Number.isInteger(t) ? t : ""}</span>
          ))}
        </div>
        <div className="relative flex-1">
          {/* recessive grid */}
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-outline-variant" style={{ bottom: `${(t / max) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {stats.days.map((d, i) => (
              <div
                key={d.date}
                className="relative flex-1 h-full flex items-end cursor-default"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                <div
                  className={`w-full rounded-t-[4px] transition-colors ${active === i ? "bg-primary" : "bg-primary/80"}`}
                  style={{ height: `${(d.answered / max) * 100}%` }}
                />
                {active === i && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-xs z-10 whitespace-nowrap rounded-lg bg-surface-raised glass border border-outline-variant shadow-md px-sm py-xs text-label-sm">
                    <span className="block text-on-surface-variant">{dayLabel(d.date, "long")}</span>
                    <span className="font-semibold text-on-surface tabular-nums">
                      {d.answered} {d.answered === 1 ? "question" : "questions"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {empty && (
            <p className="absolute inset-0 flex items-center justify-center text-label-md text-on-surface-variant">
              Your graph starts with your first set
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-between pl-8 -mt-sm text-[11px] text-on-surface-variant" aria-hidden="true">
        <span>{dayLabel(stats.days[0].date, "short")}</span>
        <span>Today</span>
      </div>

      {/* The same data for screen readers. */}
      <table className="sr-only">
        <caption>Questions answered per day, last 14 days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Questions</th>
          </tr>
        </thead>
        <tbody>
          {stats.days.map((d) => (
            <tr key={d.date}>
              <td>{dayLabel(d.date, "long")}</td>
              <td>{d.answered}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="grid grid-cols-3 gap-sm border-t border-outline-variant pt-md">
        <div>
          <dt className="text-label-sm text-on-surface-variant">Accuracy</dt>
          <dd className="font-serif font-bold text-headline-md text-on-surface tabular-nums">
            {stats.accuracy === null ? "–" : `${Math.round(stats.accuracy * 100)}%`}
          </dd>
        </div>
        <div>
          <dt className="text-label-sm text-on-surface-variant">Practised</dt>
          <dd className="font-serif font-bold text-headline-md text-on-surface tabular-nums">{empty ? "–" : compactTime(stats.practisedS)}</dd>
        </div>
        <div>
          <dt className="text-label-sm text-on-surface-variant">Questions</dt>
          <dd className="font-serif font-bold text-headline-md text-on-surface tabular-nums">{stats.answered}</dd>
        </div>
      </dl>
    </section>
  );
}
