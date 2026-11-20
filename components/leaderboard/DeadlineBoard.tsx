import Link from "next/link";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { Avatar } from "@/components/avatar";
import { HideToggle } from "@/components/leaderboard/HideToggle";
import { getDeadlineLeaderboard, getMyDeadlineStanding } from "@/lib/data";

const MEDALS = ["bg-[#f5c542] text-[#3d2e00]", "bg-[#c9d1dc] text-[#25303d]", "bg-[#d99a5b] text-[#3a2105]"];

// Deadline on /leaderboard: most wins this week (resets Monday 00:00 UTC) or
// all time. Every game counts; ties go to the better win
// rate. Students who hide from the leaderboard are left out.
export async function DeadlineBoard({ view, tabs, href }: { view: "week" | "all"; tabs: React.ReactNode; href: (v: "week" | "all") => string }) {
  const userId = await getCurrentUserId();
  const [rows, me] = await Promise.all([getDeadlineLeaderboard(view, 50), userId ? getMyDeadlineStanding(view) : null]);

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Leaderboard</h1>
        <p className="text-body-lg text-on-surface-variant">
          Deadline wins: last one in wins.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-md">
        {tabs}
        <nav aria-label="Deadline period" className="inline-flex gap-0.5 rounded-xl bg-surface-container p-0.5">
          {(["week", "all"] as const).map((v) => (
            <Link key={v} href={href(v)} aria-current={view === v ? "page" : undefined}
              className={`rounded-lg px-md py-xs text-label-md font-semibold ${view === v ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-primary"}`}>
              {v === "week" ? "This week" : "All time"}
            </Link>
          ))}
        </nav>
      </div>

      {me ? (
        <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-wrap items-center justify-between gap-md" aria-label="Your standing">
          <div className="flex flex-col">
            <span className="text-label-md text-on-surface-variant">{view === "week" ? "You this week" : "You, all time"}</span>
            <span className="font-serif font-bold text-headline-md text-on-surface tabular-nums">
              {me.wins ? `${me.rank && !me.hidden ? `#${me.rank} · ` : ""}${me.wins} win${me.wins === 1 ? "" : "s"} in ${me.games} game${me.games === 1 ? "" : "s"}` : me.games ? `${me.games} game${me.games === 1 ? "" : "s"}, no wins yet` : "No games yet"}
            </span>
            <Link href="/play/deadline" className="text-label-md font-semibold text-primary hover:underline">Play Deadline →</Link>
          </div>
          <HideToggle hidden={me.hidden} />
        </section>
      ) : (
        !userId && (
          <p className="text-body-md text-on-surface-variant">
            <Link href="/login?next=/play/deadline" className="font-semibold text-primary hover:underline">Log in</Link> and win a game to get on the board.
          </p>
        )
      )}

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-xl text-center text-body-md text-on-surface-variant">
          {view === "week" ? "No Deadline wins yet this week. Start a game with 2+ friends." : "No Deadline wins yet."}
        </p>
      ) : (
        <ol className="rounded-2xl bg-surface-container-lowest border border-outline-variant divide-y divide-outline-variant overflow-hidden">
          {rows.map((r) => (
            <li key={r.userId} className={`flex items-center gap-md px-lg py-sm ${r.userId === userId ? "bg-primary-fixed/40" : ""}`}>
              <span className={`w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-[50%] text-label-md font-bold tabular-nums ${r.rank <= 3 ? MEDALS[r.rank - 1] : "text-on-surface-variant"}`}>
                {r.rank}
              </span>
              <Avatar src={r.avatarUrl} name={r.displayName} size={32} />
              <Link href={`/profile/${r.userId}`} className="flex-1 min-w-0 truncate text-body-md font-semibold text-on-surface hover:text-primary">
                {r.displayName}{r.userId === userId && <span className="ml-xs text-label-sm font-normal text-on-surface-variant">(you)</span>}
              </Link>
              <span className="shrink-0 text-body-md font-semibold text-on-surface tabular-nums">🏆 {r.wins}</span>
              <span className="shrink-0 w-20 text-right text-label-md text-on-surface-variant tabular-nums">{r.games} game{r.games === 1 ? "" : "s"}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
