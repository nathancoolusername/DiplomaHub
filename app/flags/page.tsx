import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { ALL_CODES, COUNTRIES } from "@/lib/flags/countries";
import { dailyCodes, gameDay, nextResetAt, sprintNumber } from "@/lib/flags/daily";
import { FLAGS } from "@/lib/flags/config";
import type { FlagBoard } from "@/lib/flags/types";
import { Game } from "@/components/flags/Game";

export const metadata: Metadata = {
  title: "Flags: name every flag against the clock",
  description: "A daily sprint of 20 flags, the same for everyone, or all 197 in fifteen minutes. Type a country and its flag fills in.",
  alternates: { canonical: "/flags" },
  openGraph: { title: "Flags · DiplomaHub", description: "20 flags a day, or all 197 against the clock. Free.", url: "/flags" },
};

type Props = { searchParams: Promise<{ mode?: string }> };

// The flag game: ?mode=all for every flag, otherwise today's sprint. The
// board is worked out here (the sprint from the UTC date and a server seed)
// and the game runs in the browser; signed-in runs are timed and checked by
// app/api/flags/*.
export default async function FlagsPage({ searchParams }: Props) {
  const mode = (await searchParams).mode === "all" ? "all" : "daily";
  const userId = await getCurrentUserId();
  const day = gameDay();
  const board: FlagBoard =
    mode === "daily"
      ? { mode, codes: dailyCodes(day), day, number: sprintNumber(day), nextResetAt: nextResetAt().toISOString() }
      : { mode, codes: ALL_CODES, day: null, number: null, nextResetAt: null };

  return (
    <div className="max-w-[1040px] mx-auto px-sm sm:px-md py-lg md:py-xl flex flex-col gap-lg">
      <header className="flex flex-col items-center gap-sm text-center">
        <p className="text-label-md font-semibold text-primary uppercase tracking-wide">{mode === "daily" ? `Daily sprint #${board.number}` : "All flags"}</p>
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Flags</h1>
        <nav aria-label="Mode" className="inline-flex gap-0.5 rounded-xl bg-surface-container p-0.5">
          {(
            [
              ["daily", "Daily sprint", "/flags"],
              ["all", `All ${ALL_CODES.length}`, "/flags?mode=all"],
            ] as const
          ).map(([m, label, href]) => (
            <Link
              key={m}
              href={href}
              aria-current={mode === m ? "page" : undefined}
              className={`rounded-lg px-md py-xs text-label-md font-semibold ${mode === m ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <Game key={`${mode}:${day}`} board={board} userId={userId} />

      <details className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-md text-body-md text-on-surface">
        <summary className="cursor-pointer font-semibold">How to play</summary>
        <ul className="mt-sm flex flex-col gap-xs list-disc pl-lg text-on-surface-variant">
          <li>Type a country&apos;s name. When it matches a flag on the board, the flag fills in and the box clears. Any order.</li>
          <li>The ringed flag is the next one to name. Stuck? Press Tab (or Skip) to move on, or tap any flag to jump to it. Typing any other flag&apos;s name still counts.</li>
          <li>Spelling counts; capitals, accents and punctuation don&apos;t. Common other names work too: Ivory Coast, Czech Republic, Burma, DRC.</li>
          <li>Some names are the start of others (Niger and Nigeria, Guinea and Guinea-Bissau). Keep typing, or press Enter to take the shorter one.</li>
          <li>
            Daily sprint: {FLAGS.dailyMix[1] + FLAGS.dailyMix[2] + FLAGS.dailyMix[3]} flags, the same for everyone, {FLAGS.capSeconds.daily / 60} minutes, one go a day. Most
            flags first, then fastest. A new sprint at 00:00 UTC.
          </li>
          <li>All flags: every one of the {COUNTRIES.length}, {FLAGS.capSeconds.all / 60} minutes, play as often as you like. Your best run is on the leaderboard.</li>
          <li>
            The {COUNTRIES.length}: the 193 UN members, the two UN observer states (Vatican City and Palestine), Kosovo and Taiwan.
          </li>
        </ul>
        {!userId && (
          <p className="mt-sm text-label-md text-on-surface-variant">
            Playing as a guest.{" "}
            <Link href="/login?next=/flags" className="font-semibold text-primary hover:underline">
              Log in
            </Link>{" "}
            to save your runs and join the leaderboard.
          </p>
        )}
      </details>

      <p className="text-center text-label-sm text-on-surface-variant">
        Flag images from{" "}
        <a href="https://github.com/lipis/flag-icons" className="underline hover:text-primary" rel="noopener noreferrer" target="_blank">
          flag-icons
        </a>{" "}
        (MIT). Spotted a wrong flag or a name we should accept?{" "}
        <Link href="/feedback" className="font-semibold text-primary hover:underline">
          Tell us
        </Link>
        .
      </p>
    </div>
  );
}
