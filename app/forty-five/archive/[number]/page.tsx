import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { dayLabel, gameDay } from "@/lib/forty-five/dates";
import { getPuzzleByNumber, publicPuzzle } from "@/lib/forty-five/server";
import { Game } from "@/components/forty-five/Game";

type Props = { params: Promise<{ number: string }> };

const parse = (s: string) => (/^\d{1,5}$/.test(s) ? Number(s) : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = parse((await params).number);
  return {
    title: n ? `Forty-Five #${n}: from the archive` : "Forty-Five archive",
    alternates: { canonical: n ? `/forty-five/archive/${n}` : "/forty-five/archive" },
  };
}

// A past day's puzzle. Same game as today's (every guess checked on the
// server), but the play never counts for leaderboards or streaks.
export default async function FortyFiveArchivePuzzle({ params }: Props) {
  const n = parse((await params).number);
  if (!n) notFound();
  const [puzzle, userId] = await Promise.all([getPuzzleByNumber(n).catch(() => null), getCurrentUserId()]);
  if (!puzzle) notFound();
  if (puzzle.date >= gameDay()) redirect("/forty-five");

  return (
    <div className="max-w-[720px] mx-auto px-sm sm:px-md py-lg md:py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-xs text-center">
        <p className="text-label-md font-semibold text-primary uppercase tracking-wide">
          <Link href="/forty-five/archive" className="hover:underline">
            Archive
          </Link>{" "}
          · {dayLabel(puzzle.date)}
        </p>
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Forty-Five #{puzzle.number}</h1>
        <p className="text-body-md text-on-surface-variant">Just for fun: archive games don&apos;t change the leaderboard or your streak.</p>
      </header>

      <Game key={puzzle.id} puzzle={publicPuzzle(puzzle)} signedIn={!!userId} />

      <p className="flex flex-wrap justify-center gap-x-md text-label-md">
        <Link href="/forty-five/archive" className="font-semibold text-primary hover:underline">
          ← All past puzzles
        </Link>
        <Link href="/forty-five" className="font-semibold text-primary hover:underline">
          Today&apos;s puzzle →
        </Link>
      </p>
    </div>
  );
}
