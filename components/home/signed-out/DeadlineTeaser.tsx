import Link from "next/link";
import { PenLine, Timer } from "lucide-react";
import { TIERS } from "@/lib/deadline/config";

// Illustration only: a prompt that is not in the real bank (keep it that way: the bank is private).
const SEATS = [
  { n: "M", name: "Maya", pts: 14, ext: 2 },
  { n: "Y", name: "You", pts: 9, ext: 1, holder: true },
  { n: "L", name: "Leo", pts: 21, ext: 3 },
  { n: "A", name: "Aarav", pts: 6, ext: 0, out: true },
];
const CHIPS: [string, number][] = [["Thinkers", 1], ["Principled", 3], ["Risk-takers", 7]];

// Static on purpose (the signed-out homepage is cached for everyone): a way in to Deadline.
export default function DeadlineTeaser() {
  return (
    <section className="px-md py-xl" aria-labelledby="dl-teaser-title">
      <div className="max-w-[1000px] mx-auto rounded-3xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl grid gap-lg md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-md">
          <p className="inline-flex items-center gap-xs text-label-md font-semibold uppercase tracking-wide text-error">
            <Timer size={14} aria-hidden="true" />New · party game with friends
          </p>
          <h2 id="dl-teaser-title" className="font-serif font-bold text-headline-lg text-on-surface">Deadline</h2>
          <p className="text-body-lg text-on-surface-variant">
            Everyone gets a prompt like “Name an organelle”. Type a right answer before your deadline to pass the draft on. Miss it and you burn an extension. Last one in wins.
          </p>
          <ul className="text-body-md text-on-surface-variant flex flex-col gap-xs">
            <li>2–8 players in a private room: share a 4-letter code or a link.</li>
            <li>Rarer answers score more. The rarest are worth +7: a perfect 7. Typos are fine.</li>
            <li>Chat and reactions while you play. Wins go on your profile and the leaderboard.</li>
          </ul>
          <div className="flex flex-wrap gap-sm">
            <Link href="/play/deadline" prefetch={false} className="rounded-full bg-primary text-on-primary px-lg py-sm text-label-md font-semibold">
              Start a game
            </Link>
            <Link href="/leaderboard?period=deadline" prefetch={false} className="rounded-full border border-outline-variant px-lg py-sm text-label-md font-semibold text-on-surface hover:border-primary">
              Most wins this week
            </Link>
          </div>
        </div>

        <div aria-hidden="true" className="select-none flex flex-col gap-md">
          <div className="grid grid-cols-4 gap-sm">
            {SEATS.map((s) => (
              <div key={s.name} className={`flex flex-col items-center gap-0.5 ${s.out ? "opacity-40" : ""}`}>
                <span className={`relative w-11 h-11 rounded-full bg-surface-container-low border border-outline-variant flex items-center justify-center font-bold text-primary ${s.holder ? "ring-4 ring-error ring-offset-2 ring-offset-surface-container-lowest" : ""}`}>
                  {s.n}
                  {s.holder && <span className="absolute -right-1 -bottom-1 rounded-full bg-error text-on-error p-0.5"><PenLine size={10} /></span>}
                </span>
                <span className="text-label-sm font-semibold text-on-surface">{s.name}</span>
                <span className="flex items-center gap-xs">
                  {s.out ? (
                    <span className="text-label-sm font-bold text-error">Out</span>
                  ) : (
                    <span className="inline-flex gap-0.5">
                      {[0, 1, 2, 3].map((i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < s.ext ? "bg-primary" : "bg-outline-variant/60"}`} />)}
                    </span>
                  )}
                  <span className="text-label-sm tabular-nums text-on-surface-variant">{s.pts}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="dl-clock px-lg py-lg flex flex-col items-center text-center gap-xs" style={{ "--dl-p": 0.72 } as React.CSSProperties} data-mine="true">
            <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">Mixed · Prompt 4</span>
            <span className="font-serif font-bold text-headline-md text-on-surface">Name an IB learner profile attribute</span>
            <span className="text-body-md font-semibold text-error">Your turn!</span>
          </div>
          <div className="flex flex-wrap justify-center gap-xs">
            {CHIPS.map(([a, p]) => (
              <span key={a} className="inline-flex items-center gap-xs rounded-full border-2 bg-surface-container-lowest px-sm py-0.5 text-label-md font-semibold text-on-surface" style={{ borderColor: TIERS[p].color }}>
                {a} <span className="font-bold" style={{ color: TIERS[p].color }}>+{p}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
