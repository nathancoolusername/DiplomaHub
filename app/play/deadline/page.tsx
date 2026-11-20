import Link from "next/link";
import type { Metadata } from "next";
import { Timer, Trophy } from "lucide-react";
import { getCurrentPlayer } from "@/app/lib/get-current-user";
import { GuestUpgrade } from "@/components/deadline/Guest";
import { getDeadlineStats, getMyDeadlineStanding, getMySquads, logDeadlineEvent } from "@/lib/data";
import { PlayStart, SquadGameButton } from "@/components/deadline/PlayStart";

export const metadata: Metadata = {
  title: "Deadline",
  description: "A fast typing party game for IB students: name answers before your deadline, rarer answers score more, last one in wins.",
  robots: { index: false },
};

// Deadline's home: your record, Create a room, Join with a code, and a game
// with any of your squads.
export default async function DeadlinePlayPage() {
  // Signed out: join with a code (as a guest, from the room's page) or sign up to create.
  // Guests: the same, plus "keep your wins". Accounts: everything.
  const player = await getCurrentPlayer();
  const member = player && !player.guest ? player.id : null;
  const [stats, week, squads] = await Promise.all([
    player ? getDeadlineStats(player.id) : null,
    member ? getMyDeadlineStanding("week") : null,
    member ? getMySquads() : [],
    player ? logDeadlineEvent("play_page_opened") : null,
  ]);

  return (
    <div className="dh-page-bg bg-surface-container-low min-h-full">
      <div className="max-w-[860px] mx-auto px-md py-xl flex flex-col gap-lg">
        <header className="flex flex-col gap-sm">
          <p className="inline-flex items-center gap-xs text-label-md font-semibold uppercase tracking-wide text-primary"><Timer size={14} aria-hidden="true" />Party game</p>
          <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Deadline</h1>
          <p className="text-body-lg text-on-surface-variant max-w-[40rem]">
            Name an answer before your deadline, then pass the draft. Rarer answers score more. Miss a deadline and you burn an extension. Last one in wins.
          </p>
        </header>

        {player?.guest && <GuestUpgrade next="/play/deadline" />}
        <PlayStart canCreate={!!member} />

        {stats && (<>
        <section className="grid grid-cols-3 gap-sm" aria-label="Your record">
          {[
            ["Wins", stats.wins],
            ["Games", stats.games],
            ["Best streak", stats.bestStreak],
          ].map(([label, n]) => (
            <div key={label} className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-md">
              <p className="text-label-md text-on-surface-variant">{label}</p>
              <p className="font-serif font-bold text-headline-lg tabular-nums text-on-surface">{n}</p>
            </div>
          ))}
        </section>
        <p className="text-label-md text-on-surface-variant -mt-sm">
          {week?.rank ? <>You&apos;re <strong>#{week.rank}</strong> this week. </> : null}
          <Link href="/leaderboard?period=deadline" className="inline-flex items-center gap-xs font-semibold text-primary"><Trophy size={13} aria-hidden="true" />Leaderboard</Link>
        </p>
        </>)}

        {squads.length > 0 && (
          <section className="flex flex-col gap-sm" aria-labelledby="dl-squads">
            <h2 id="dl-squads" className="font-serif font-bold text-headline-md text-on-surface">Play with a squad</h2>
            <ul className="flex flex-col gap-xs">
              {squads.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-sm rounded-2xl border border-outline-variant bg-surface-container-lowest px-md py-sm">
                  <Link href={`/squads/${s.id}`} className="font-semibold text-on-surface hover:text-primary">{s.name}
                    <span className="font-normal text-label-md text-on-surface-variant"> · {s.members} member{s.members === 1 ? "" : "s"}</span></Link>
                  <SquadGameButton squadId={s.id} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
