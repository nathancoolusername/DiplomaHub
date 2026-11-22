import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getArchive } from "@/lib/forty-five/server";
import { ArchiveList } from "@/components/forty-five/ArchiveList";

export const metadata: Metadata = {
  title: "Forty-Five archive: every past puzzle",
  description: "Missed a day? Play every past Forty-Five, the daily IB word puzzle. Free.",
  alternates: { canonical: "/forty-five/archive" },
};

// Every daily puzzle before today. Only numbers and dates are listed; words
// are sent only by the puzzle's own page, and answers only once it's played.
export default async function FortyFiveArchive() {
  const userId = await getCurrentUserId();
  const entries = await getArchive(userId).catch(() => []);

  return (
    <div className="max-w-[720px] mx-auto px-sm sm:px-md py-lg md:py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-xs text-center">
        <p className="text-label-md font-semibold text-primary uppercase tracking-wide">Archive</p>
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Past Forty-Fives</h1>
        <p className="text-body-md text-on-surface-variant">
          Missed a day? Play any earlier puzzle. Archive games are just for fun: they don&apos;t change the leaderboard or your streak.
        </p>
        <p>
          <Link href="/forty-five" className="text-label-md font-semibold text-primary hover:underline">
            ← Today&apos;s puzzle
          </Link>
        </p>
      </header>

      {entries.length ? (
        <ArchiveList entries={entries} signedIn={!!userId} />
      ) : (
        <p className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-xl text-center text-body-md text-on-surface-variant">
          No past puzzles yet. Come back tomorrow.
        </p>
      )}
    </div>
  );
}
