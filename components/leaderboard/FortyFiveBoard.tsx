import Link from "next/link";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { HideToggle } from "@/components/leaderboard/HideToggle";
import { formatTime, gameDay } from "@/lib/forty-five/dates";
import { getAllTimeBoard, getDailyBoard, getMyAllTimeStanding, getMyDailyStanding, getTodayPuzzle } from "@/lib/forty-five/server";
import type { AllTimeRow, BoardRow } from "@/lib/forty-five/types";

const PAGE_SIZE = 25;
const MEDALS = ["bg-[#f5c542] text-[#3d2e00]", "bg-[#c9d1dc] text-[#25303d]", "bg-[#d99a5b] text-[#3a2105]"];

type View = "daily" | "alltime";

// Forty-Five on /leaderboard: today's puzzle (score desc, then time asc) or
// all time (total desc, then average, then who got there first). Only daily
// puzzles played on their day count. Names only; hidden students are left out.
export async function FortyFiveBoard({ view, page, tabs, href }: { view: View; page: number; tabs: React.ReactNode; href: (v: View, n?: number) => string }) {
  const userId = await getCurrentUserId();
  const today = gameDay();
  const offset = (page - 1) * PAGE_SIZE;

  let error = false;
  let daily: { total: number; rows: BoardRow[] } | null = null;
  let alltime: { total: number; rows: AllTimeRow[] } | null = null;
  let mine: { label: string; value: string; hidden: boolean } | null = null;
  let number: number | null = null;
  try {
    if (view === "daily") {
      const [board, puzzle, me] = await Promise.all([
        getDailyBoard(today, PAGE_SIZE, offset, userId),
        getTodayPuzzle(),
        userId ? getMyDailyStanding(userId, today) : null,
      ]);
      daily = board;
      number = puzzle?.number ?? null;
      if (me)
        mine = {
          label: "You today",
          hidden: me.hidden,
          value: me.finished ? `${me.rank && !me.hidden ? `#${me.rank} · ` : ""}${me.score}/45 in ${formatTime(me.seconds)}` : me.played ? "In progress" : "Not played yet",
        };
    } else {
      const [board, me] = await Promise.all([getAllTimeBoard(PAGE_SIZE, offset, userId), userId ? getMyAllTimeStanding(userId) : null]);
      alltime = board;
      if (me)
        mine = {
          label: "You, all time",
          hidden: me.hidden,
          value: me.games ? `${me.rank && !me.hidden ? `#${me.rank} · ` : ""}${me.total} points · ${me.games} games` : "No games yet",
        };
    }
  } catch {
    error = true; // migrations 34–35 not run yet, or the database is unreachable
  }
  const total = (daily ?? alltime)?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Leaderboard</h1>
        <p className="text-body-lg text-on-surface-variant">
          <Link href="/forty-five" className="font-semibold text-primary hover:underline">
            Forty-Five
          </Link>
          , the daily IB word puzzle. {view === "daily" ? "Today: highest score first, then fastest." : "All time: total points from every daily puzzle, played on its day."}
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-md">
        {tabs}
        <nav aria-label="Forty-Five view" className="inline-flex gap-0.5 rounded-xl bg-surface-container p-0.5">
          {(["daily", "alltime"] as View[]).map((v) => (
            <Link
              key={v}
              href={href(v)}
              aria-current={view === v ? "page" : undefined}
              className={`rounded-lg px-md py-xs text-label-md font-semibold ${view === v ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
            >
              {v === "daily" ? (number ? `Today (#${number})` : "Today") : "All time"}
            </Link>
          ))}
        </nav>
      </div>

      {mine ? (
        <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-wrap items-center justify-between gap-md" aria-label="Your standing">
          <div className="flex flex-col">
            <span className="text-label-md text-on-surface-variant">{mine.label}</span>
            <span className="font-serif font-bold text-headline-md text-on-surface tabular-nums">{mine.value}</span>
            <Link href="/forty-five" className="text-label-md font-semibold text-primary hover:underline">
              Play today&apos;s puzzle →
            </Link>
          </div>
          <HideToggle hidden={mine.hidden} />
        </section>
      ) : (
        !userId && (
          <p className="text-body-md text-on-surface-variant">
            <Link href="/login?next=/leaderboard?period=forty-five" className="font-semibold text-primary hover:underline">
              Log in
            </Link>{" "}
            and play{" "}
            <Link href="/forty-five" className="font-semibold text-primary hover:underline">
              today&apos;s puzzle
            </Link>{" "}
            to get on the board. Guest games don&apos;t count.
          </p>
        )
      )}

      {error ? (
        <p className="text-body-md text-on-surface-variant">The leaderboard isn&apos;t available right now.</p>
      ) : total === 0 ? (
        <p className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-xl text-center text-body-md text-on-surface-variant">
          {view === "daily" ? "Nobody's finished today's puzzle yet. Be first." : "Nobody's on the board yet."}
        </p>
      ) : (
        <ol className="rounded-2xl bg-surface-container-lowest border border-outline-variant divide-y divide-outline-variant overflow-hidden">
          {view === "alltime" && (
            <li className="flex items-center gap-md px-lg py-xs text-label-sm text-on-surface-variant" aria-hidden="true">
              <span className="w-8" />
              <span className="flex-1">Name</span>
              <span className="w-12 text-right">Games</span>
              <span className="w-14 text-right">Avg</span>
              <span className="w-16 text-right">Total</span>
            </li>
          )}
          {(daily?.rows ?? alltime?.rows ?? []).map((r) => (
            <li key={`${r.rank}-${r.name}`} className={`flex items-center gap-md px-lg py-sm ${r.isMe ? "bg-primary-fixed/40" : ""}`}>
              <span
                className={`w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-[50%] text-label-md font-bold tabular-nums ${r.rank <= 3 ? MEDALS[r.rank - 1] : "text-on-surface-variant"}`}
              >
                {r.rank}
              </span>
              <span className="flex-1 min-w-0 truncate text-body-md font-semibold text-on-surface">
                {r.name}
                {r.isMe && <span className="ml-xs text-label-sm font-normal text-on-surface-variant">(you)</span>}
              </span>
              {"score" in r ? (
                <>
                  <span className="shrink-0 text-body-md font-semibold text-on-surface tabular-nums">{r.score}/45</span>
                  <span className="shrink-0 w-14 text-right text-body-md text-on-surface-variant tabular-nums">{formatTime(r.seconds)}</span>
                </>
              ) : (
                <>
                  <span className="shrink-0 w-12 text-right text-body-md text-on-surface-variant tabular-nums">{r.games}</span>
                  <span className="shrink-0 w-14 text-right text-body-md text-on-surface-variant tabular-nums">{r.average.toFixed(1)}</span>
                  <span className="shrink-0 w-16 text-right text-body-md font-semibold text-on-surface tabular-nums">{r.total.toLocaleString()}</span>
                </>
              )}
            </li>
          ))}
        </ol>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-center gap-md">
          {page > 1 && (
            <Link href={href(view, page - 1)} className="text-label-md font-semibold text-primary hover:underline">
              ← Previous
            </Link>
          )}
          <span className="text-label-md text-on-surface-variant tabular-nums">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={href(view, page + 1)} className="text-label-md font-semibold text-primary hover:underline">
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
