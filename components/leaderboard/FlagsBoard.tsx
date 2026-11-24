import Link from "next/link";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { HideToggle } from "@/components/leaderboard/HideToggle";
import { gameDay, sprintNumber } from "@/lib/flags/daily";
import { formatTime } from "@/lib/flags/engine";
import { getAllBoard, getDailyBoard, getMyStanding, type Standing } from "@/lib/flags/server";
import type { BoardRow } from "@/lib/flags/types";

const PAGE_SIZE = 25;
const MEDALS = ["bg-[#f5c542] text-[#3d2e00]", "bg-[#c9d1dc] text-[#25303d]", "bg-[#d99a5b] text-[#3a2105]"];

type View = "daily" | "all";

// Flags on /leaderboard: today's sprint, or each student's best all-flags run.
// Most flags first, then fastest. Names only; hidden students are left out.
export async function FlagsBoard({ view, page, tabs, href }: { view: View; page: number; tabs: React.ReactNode; href: (v: View, n?: number) => string }) {
  const userId = await getCurrentUserId();
  const day = gameDay();
  let board: { total: number; rows: BoardRow[] } | null = null;
  let me: Standing | null = null;
  try {
    [board, me] = await Promise.all([
      view === "daily" ? getDailyBoard(day, PAGE_SIZE, (page - 1) * PAGE_SIZE, userId) : getAllBoard(PAGE_SIZE, (page - 1) * PAGE_SIZE, userId),
      userId ? getMyStanding(userId, view) : null,
    ]);
  } catch {
    board = null; // the flags migration not run yet, or the database is unreachable
  }
  const total = board?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const play = view === "daily" ? "/flags" : "/flags?mode=all";

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Leaderboard</h1>
        <p className="text-body-lg text-on-surface-variant">
          <Link href={play} className="font-semibold text-primary hover:underline">
            Flags
          </Link>
          . {view === "daily" ? "Today's sprint: most flags first, then fastest." : "All flags: each student's best run, most flags first, then fastest."}
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-md">
        {tabs}
        <nav aria-label="Flags view" className="inline-flex gap-0.5 rounded-xl bg-surface-container p-0.5">
          {(["daily", "all"] as View[]).map((v) => (
            <Link
              key={v}
              href={href(v)}
              aria-current={view === v ? "page" : undefined}
              className={`rounded-lg px-md py-xs text-label-md font-semibold ${view === v ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
            >
              {v === "daily" ? `Today (#${sprintNumber(day)})` : "All flags"}
            </Link>
          ))}
        </nav>
      </div>

      {me ? (
        <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-wrap items-center justify-between gap-md" aria-label="Your standing">
          <div className="flex flex-col">
            <span className="text-label-md text-on-surface-variant">{view === "daily" ? "You today" : "Your best run"}</span>
            <span className="font-serif font-bold text-headline-md text-on-surface tabular-nums">
              {me.played ? `${me.rank && !me.hidden ? `#${me.rank} · ` : ""}${me.correct}/${me.total} in ${formatTime(me.seconds)}` : view === "daily" ? "Not played yet" : "No runs yet"}
            </span>
            <Link href={play} className="text-label-md font-semibold text-primary hover:underline">
              {view === "daily" ? "Play today's sprint →" : "Name all the flags →"}
            </Link>
          </div>
          <HideToggle hidden={me.hidden} />
        </section>
      ) : (
        !userId && (
          <p className="text-body-md text-on-surface-variant">
            <Link href={`/login?next=/leaderboard?period=${view === "daily" ? "flags" : "flags-all"}`} className="font-semibold text-primary hover:underline">
              Log in
            </Link>{" "}
            and{" "}
            <Link href={play} className="font-semibold text-primary hover:underline">
              play
            </Link>{" "}
            to get on the board. Guest runs don&apos;t count.
          </p>
        )
      )}

      {!board ? (
        <p className="text-body-md text-on-surface-variant">The leaderboard isn&apos;t available right now.</p>
      ) : total === 0 ? (
        <p className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-xl text-center text-body-md text-on-surface-variant">
          {view === "daily" ? "Nobody's finished today's sprint yet. Be first." : "Nobody's on the board yet."}
        </p>
      ) : (
        <ol className="rounded-2xl bg-surface-container-lowest border border-outline-variant divide-y divide-outline-variant overflow-hidden">
          {board.rows.map((r) => (
            <li key={`${r.rank}-${r.name}`} className={`flex items-center gap-md px-lg py-sm ${r.isMe ? "bg-primary-fixed/40" : ""}`}>
              <span className={`w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-[50%] text-label-md font-bold tabular-nums ${r.rank <= 3 ? MEDALS[r.rank - 1] : "text-on-surface-variant"}`}>
                {r.rank}
              </span>
              <span className="flex-1 min-w-0 truncate text-body-md font-semibold text-on-surface">
                {r.name}
                {r.isMe && <span className="ml-xs text-label-sm font-normal text-on-surface-variant">(you)</span>}
              </span>
              <span className="shrink-0 text-body-md font-semibold text-on-surface tabular-nums">
                {r.correct}/{r.total}
              </span>
              <span className="shrink-0 w-14 text-right text-body-md text-on-surface-variant tabular-nums">{formatTime(r.seconds)}</span>
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
