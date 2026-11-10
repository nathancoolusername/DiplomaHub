import Link from "next/link";

// Illustration only: none of these words are in a real puzzle (keep it that way).
const ROWS = [
  { bg: "bg-ff-1", text: "text-on-ff-1", name: "Warm-up · solved" },
  { bg: "bg-ff-2", text: "text-on-ff-2", name: "Steady · solved" },
];
const LOOSE = ["Orbit", "Mantle", "Pulse", "Bank", "Cortex", "Scale", "Tide", "Pixel"];

// Static on purpose (the signed-out homepage is cached for everyone): never
// shows a real puzzle, just a way in to today's Forty-Five.
export default function FortyFiveTeaser() {
  return (
    <section className="px-md py-xl" aria-labelledby="ff-teaser-title">
      <div className="max-w-[1000px] mx-auto rounded-3xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl grid gap-lg md:grid-cols-2 md:items-center">
        <div className="flex flex-col gap-md">
          <p className="text-label-md font-semibold uppercase tracking-wide text-primary">New · free daily puzzle</p>
          <h2 id="ff-teaser-title" className="font-serif font-bold text-headline-lg text-on-surface">
            Forty-Five
          </h2>
          <p className="text-body-lg text-on-surface-variant">
            16 words from across the IB hide 4 groups of 4. Biology meets Economics meets TOK, and some words fit more than one. Everyone gets the same puzzle, and a new one arrives at 00:00 UTC.
          </p>
          <ul className="text-body-md text-on-surface-variant flex flex-col gap-xs">
            <li>Start on 45 points, lose 4 for each wrong guess.</li>
            <li>Every group explains its link afterwards, so it&apos;s revision too.</li>
            <li>No account needed. Sign in to get on the daily leaderboard.</li>
          </ul>
          <div className="flex flex-wrap gap-sm">
            <Link href="/forty-five" prefetch={false} className="rounded-full bg-primary text-on-primary px-lg py-sm text-label-md font-semibold">
              Play today&apos;s puzzle
            </Link>
            <Link href="/leaderboard?period=forty-five" prefetch={false} className="rounded-full border border-outline-variant px-lg py-sm text-label-md font-semibold text-on-surface hover:border-primary">
              Today&apos;s leaderboard
            </Link>
          </div>
        </div>
        <div aria-hidden="true" className="flex flex-col gap-1.5 select-none">
          {ROWS.map((r, i) => (
            <div key={i} className={`rounded-xl ${r.bg} ${r.text} py-md text-center text-label-md font-bold uppercase tracking-wide`}>
              {r.name}
            </div>
          ))}
          <div className="grid grid-cols-4 gap-1.5">
            {LOOSE.map((w) => (
              <span key={w} className="rounded-lg bg-surface-container-high py-sm text-center text-label-md font-bold text-on-surface">
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
