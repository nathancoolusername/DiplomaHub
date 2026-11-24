import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ChevronRight, Flag, Timer, Users } from "lucide-react";
import { FortyFiveMark } from "@/components/forty-five/FortyFiveMark";

export const metadata: Metadata = {
  title: "Games",
  description: "DiplomaHub's games: Forty-Five, the daily word puzzle; Deadline, the party game to play with friends; and Flags, every flag against the clock.",
  alternates: { canonical: "/games" },
};

// /games: every game in one place (the menu's "Games" item). Static.
export default function GamesPage() {
  return (
    <div className="max-w-[960px] mx-auto px-md py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Games</h1>
        <p className="text-body-lg text-on-surface-variant">A few minutes off, for a break between sets or a night with friends.</p>
      </header>

      <div className="grid gap-md md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/forty-five"
          className="group rounded-3xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl flex flex-col gap-md hover:border-primary transition-colors"
        >
          <span className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center scale-150" aria-hidden="true">
            <FortyFiveMark />
          </span>
          <span className="flex flex-col gap-xs">
            <span className="font-serif font-bold text-headline-md text-on-surface group-hover:text-primary">Forty-Five</span>
            <span className="text-label-md font-semibold text-on-surface-variant">Daily puzzle · on your own</span>
          </span>
          <span className="text-body-md text-on-surface-variant">
            16 words from across the IB. Find the four hidden groups of four before you run out of lives. A new puzzle every day at midnight UTC.
          </span>
          <span className="mt-auto inline-flex items-center gap-xs text-label-md font-semibold text-primary">
            Play today&apos;s puzzle <ChevronRight size={16} aria-hidden="true" />
          </span>
        </Link>

        <Link
          href="/play/deadline"
          className="group rounded-3xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl flex flex-col gap-md hover:border-primary transition-colors"
        >
          <span className="w-12 h-12 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center" aria-hidden="true">
            <Timer size={22} />
          </span>
          <span className="flex flex-col gap-xs">
            <span className="font-serif font-bold text-headline-md text-on-surface group-hover:text-primary">Deadline</span>
            <span className="inline-flex items-center gap-xs text-label-md font-semibold text-on-surface-variant">
              <Users size={14} aria-hidden="true" /> Party game · with friends
            </span>
          </span>
          <span className="text-body-md text-on-surface-variant">
            Name an answer to an IB prompt before your deadline. Rarer answers score more, and the last one in wins. Share a code and play together.
          </span>
          <span className="mt-auto inline-flex items-center gap-xs text-label-md font-semibold text-primary">
            Start a game <ChevronRight size={16} aria-hidden="true" />
          </span>
        </Link>
        <Link
          href="/flags"
          className="group rounded-3xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl flex flex-col gap-md hover:border-primary transition-colors"
        >
          <span className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center" aria-hidden="true">
            <Flag size={22} />
          </span>
          <span className="flex flex-col gap-xs">
            <span className="font-serif font-bold text-headline-md text-on-surface group-hover:text-primary">Flags</span>
            <span className="text-label-md font-semibold text-on-surface-variant">Daily sprint · against the clock</span>
          </span>
          <span className="text-body-md text-on-surface-variant">
            Type a country and its flag fills in. Twenty flags a day, the same for everyone, or all 197 in fifteen minutes.
          </span>
          <span className="mt-auto inline-flex items-center gap-xs text-label-md font-semibold text-primary">
            Play today&apos;s sprint <ChevronRight size={16} aria-hidden="true" />
          </span>
        </Link>
      </div>

      <Link href="/forty-five/archive" className="self-start inline-flex items-center gap-xs text-label-md text-on-surface-variant hover:text-primary">
        <Archive size={14} aria-hidden="true" /> Forty-Five archive: every past puzzle
      </Link>
    </div>
  );
}
