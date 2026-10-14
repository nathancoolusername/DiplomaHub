import Link from "next/link";
import type { Metadata } from "next";
import type { LeaderboardPage, LeaderboardPeriod, LeaderboardStanding } from "@/lib/data/types";
import { getLeaderboard, getMyStanding } from "@/lib/data";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { Avatar } from "@/components/avatar";
import { HideToggle } from "@/components/leaderboard/HideToggle";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Who's practising most on DiplomaHub this week and of all time, ranked by practice points.",
  alternates: { canonical: "/leaderboard" },
};

const PAGE_SIZE = 25;

type Props = { searchParams: Promise<{ period?: string; page?: string }> };

const MEDALS = ["bg-[#f5c542] text-[#3d2e00]", "bg-[#c9d1dc] text-[#25303d]", "bg-[#d99a5b] text-[#3a2105]"];

// Practice leaderboard: this week (resets Monday 00:00 UTC) or all time.
// Public; signed-in students also see their own standing and can hide themselves.
export default async function Leaderboard({ searchParams }: Props) {
  const sp = await searchParams;
  const period: LeaderboardPeriod = sp.period === "all" ? "all" : "week";
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const signedIn = !!(await getCurrentUserId());

  let board: LeaderboardPage | null = null;
  let standing: LeaderboardStanding | null = null;
  try {
    [board, standing] = await Promise.all([getLeaderboard(period, page, PAGE_SIZE), signedIn ? getMyStanding(period) : Promise.resolve(null)]);
  } catch {
    board = null; // migration 15 not run yet, or the database is unreachable
  }
  const pages = board ? Math.max(1, Math.ceil(board.total / PAGE_SIZE)) : 1;
  const href = (p: LeaderboardPeriod, n = 1) => `/leaderboard?${new URLSearchParams({ ...(p === "all" ? { period: "all" } : {}), ...(n > 1 ? { page: String(n) } : {}) })}`;

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Leaderboard</h1>
        <p className="text-body-lg text-on-surface-variant">
          Points come from practice: 1 for every mark you earn, plus 1 for every 5 minutes you practise. Only finished sets count.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-md">
        <nav aria-label="Period" className="inline-flex gap-0.5 rounded-xl bg-surface-container p-0.5">
          {(["week", "all"] as const).map((p) => (
            <Link
              key={p}
              href={href(p)}
              aria-current={period === p ? "page" : undefined}
              className={`rounded-lg px-md py-xs text-label-md font-semibold ${
                period === p ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {p === "week" ? "This week" : "All time"}
            </Link>
          ))}
        </nav>
        {period === "week" && <p className="text-label-md text-on-surface-variant">Resets every Monday</p>}
      </div>

      {standing ? (
        <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-wrap items-center justify-between gap-md" aria-label="Your standing">
          <div className="flex flex-col">
            <span className="text-label-md text-on-surface-variant">{period === "week" ? "You this week" : "You, all time"}</span>
            <span className="font-serif font-bold text-headline-md text-on-surface tabular-nums">
              {standing.hidden ? `${standing.points} points` : standing.rank ? `#${standing.rank} · ${standing.points} points` : "No points yet"}
            </span>
            {!standing.hidden && !standing.rank && (
              <Link href="/practice" className="text-label-md font-semibold text-primary hover:underline">
                Finish a set to get on the board →
              </Link>
            )}
          </div>
          <HideToggle hidden={standing.hidden} />
        </section>
      ) : (
        !signedIn && (
          <p className="text-body-md text-on-surface-variant">
            <Link href="/login?next=/leaderboard" className="font-semibold text-primary hover:underline">
              Log in
            </Link>{" "}
            and practise to get on the board.
          </p>
        )
      )}

      {!board ? (
        <p className="text-body-md text-on-surface-variant">The leaderboard isn&apos;t available right now.</p>
      ) : board.rows.length === 0 ? (
        <p className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-xl text-center text-body-md text-on-surface-variant">
          {period === "week" ? "Nobody's on the board yet this week. Finish a set to be first." : "Nobody's on the board yet."}
        </p>
      ) : (
        <ol className="rounded-2xl bg-surface-container-lowest border border-outline-variant divide-y divide-outline-variant overflow-hidden">
          {board.rows.map((r) => (
            <li key={`${r.rank}-${r.displayName}`} className={`flex items-center gap-md px-lg py-sm ${r.isMe ? "bg-primary-fixed/40" : ""}`}>
              <span
                className={`w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-[50%] text-label-md font-bold tabular-nums ${
                  r.rank <= 3 ? MEDALS[r.rank - 1] : "text-on-surface-variant"
                }`}
              >
                {r.rank}
              </span>
              <Avatar src={r.avatarUrl} name={r.displayName} size={32} />
              <span className="flex-1 min-w-0 truncate text-body-md font-semibold text-on-surface">
                {r.displayName}
                {r.isMe && <span className="ml-xs text-label-sm font-normal text-on-surface-variant">(you)</span>}
              </span>
              <span className="shrink-0 text-body-md font-semibold text-on-surface tabular-nums">{r.points.toLocaleString()} pts</span>
            </li>
          ))}
        </ol>
      )}

      {board && pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-center gap-md">
          {page > 1 && (
            <Link href={href(period, page - 1)} className="text-label-md font-semibold text-primary hover:underline">
              ← Previous
            </Link>
          )}
          <span className="text-label-md text-on-surface-variant tabular-nums">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={href(period, page + 1)} className="text-label-md font-semibold text-primary hover:underline">
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
