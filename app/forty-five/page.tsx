import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getTodayPuzzle, publicPuzzle } from "@/lib/forty-five/server";
import { FORTY_FIVE } from "@/lib/forty-five/config";
import { TIERS, type Tier } from "@/lib/forty-five/tiers";
import { Game } from "@/components/forty-five/Game";

export const metadata: Metadata = {
  title: "Forty-Five: the daily IB word puzzle",
  description: "16 words from across the IB. Find the 4 hidden groups of 4 before you run out of lives. A new puzzle every day at 00:00 UTC.",
  alternates: { canonical: "/forty-five" },
  openGraph: {
    title: "Forty-Five · DiplomaHub",
    description: "16 IB words, 4 hidden groups. One puzzle a day, free.",
    url: "/forty-five",
  },
};

// The daily puzzle. Only the 16 shuffled words are sent to the browser; every
// guess is checked on the server (app/api/forty-five/guess).
export default async function FortyFivePage() {
  const [puzzle, userId] = await Promise.all([getTodayPuzzle().catch(() => null), getCurrentUserId()]);

  return (
    <div className="max-w-[720px] mx-auto px-sm sm:px-md py-lg md:py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-xs text-center">
        <p className="text-label-md font-semibold text-primary uppercase tracking-wide">Daily puzzle</p>
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">{puzzle ? `Forty-Five #${puzzle.number}` : "Forty-Five"}</h1>
        <p className="text-body-md text-on-surface-variant">Sixteen words from across the IB hide four groups of four. Some words fit more than one subject.</p>
      </header>

      {puzzle ? (
        <Game key={puzzle.id} puzzle={publicPuzzle(puzzle)} signedIn={!!userId} />
      ) : (
        <p className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-xl text-center text-body-md text-on-surface-variant">
          No puzzle today, sorry. Check back after 00:00 UTC.
        </p>
      )}

      <p className="text-center text-label-md text-on-surface-variant">
        Forty-Five is new. If a group or explanation looks wrong,{" "}
        <Link href="/feedback" className="font-semibold text-primary hover:underline">
          tell us
        </Link>{" "}
        and we&apos;ll fix it. Not affiliated with the IB.
      </p>

      <details className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-md text-body-md text-on-surface">
        <summary className="cursor-pointer font-semibold">How to play</summary>
        <ul className="mt-sm flex flex-col gap-xs list-disc pl-lg text-on-surface-variant">
          <li>Pick four words you think share a link, then press Check.</li>
          <li>
            You start on {FORTY_FIVE.startScore} points. Each wrong guess costs {FORTY_FIVE.mistakePenalty} points and one of your {FORTY_FIVE.maxMistakes} lives.
          </li>
          <li>Three out of four right? You&apos;ll see “One away…”.</li>
          <li>
            Run out of lives and you score {FORTY_FIVE.lossPointsPerGroup} for each group you found. Each group explains its link afterwards, so every game is a little revision.
          </li>
          <li>
            Groups come in four levels:{" "}
            {([1, 2, 3, 4] as Tier[]).map((t, i) => (
              <span key={t}>
                <span className={`inline-block rounded px-1 text-label-sm font-semibold ${TIERS[t].bg} ${TIERS[t].text}`}>{TIERS[t].name}</span>
                {i < 3 ? " " : ""}
              </span>
            ))}
          </li>
          <li>Everyone gets the same puzzle. A new one arrives at 00:00 UTC.</li>
        </ul>
        {!userId && (
          <p className="mt-sm text-label-md text-on-surface-variant">
            Playing as a guest.{" "}
            <Link href="/login?next=/forty-five" className="font-semibold text-primary hover:underline">
              Log in
            </Link>{" "}
            to save your score and join the leaderboard.
          </p>
        )}
      </details>
    </div>
  );
}
