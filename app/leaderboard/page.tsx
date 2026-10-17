import Link from "next/link";
import type { Metadata } from "next";
import type { LeaderboardPage, LeaderboardPeriod, LeaderboardStanding } from "@/lib/data/types";
import { getContributionBoard, getLeaderboard, getMyContribution, getMyStanding } from "@/lib/data";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { Avatar } from "@/components/avatar";
import { HideToggle } from "@/components/leaderboard/HideToggle";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Who's practising most on DiplomaHub this week and of all time, and who has shared the most with the community.",
  alternates: { canonical: "/leaderboard" },
};

const PAGE_SIZE = 25;

type Props = { searchParams: Promise<{ period?: string; page?: string }> };

const MEDALS = ["bg-[#f5c542] text-[#3d2e00]", "bg-[#c9d1dc] text-[#25303d]", "bg-[#d99a5b] text-[#3a2105]"];

type Board = LeaderboardPeriod | "contribution";
const TABS: { id: Board; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "all", label: "All time" },
  { id: "contribution", label: "Contribution" },
];

// Practice leaderboard: this week (resets Monday 00:00 UTC) or all time; and
// Contribution, the site's original points for sharing. Public; signed-in
// students also see their own standing and can hide themselves (from all three).
export default async function Leaderboard({ searchParams }: Props) {
  const sp = await searchParams;
  const tab: Board = sp.period === "all" ? "all" : sp.period === "contribution" ? "contribution" : "week";
  if (tab === "contribution") return <ContributionBoard page={Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1)} />;
  const period: LeaderboardPeriod = tab;
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
  const href = (p: LeaderboardPeriod, n = 1) => boardHref(p, n);

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Leaderboard</h1>
        <p className="text-body-lg text-on-surface-variant">
          Points come from practice: 1 for every mark you earn, plus 1 for every 5 minutes you practise. Only finished sets count.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-md">
        <BoardTabs current={period} />
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
        <Rows rows={board.rows} />
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

function boardHref(b: Board, n = 1): string {
  const q = new URLSearchParams({ ...(b !== "week" ? { period: b } : {}), ...(n > 1 ? { page: String(n) } : {}) }).toString();
  return q ? `/leaderboard?${q}` : "/leaderboard";
}

function BoardTabs({ current }: { current: Board }) {
  return (
    <nav aria-label="Leaderboard" className="inline-flex gap-0.5 rounded-xl bg-surface-container p-0.5">
      {TABS.map((t) => (
        <Link
          key={t.id}
          href={boardHref(t.id)}
          aria-current={current === t.id ? "page" : undefined}
          className={`rounded-lg px-md py-xs text-label-md font-semibold ${
            current === t.id ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant hover:text-primary"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

function Rows({ rows }: { rows: LeaderboardPage["rows"] }) {
  return (
    <ol className="rounded-2xl bg-surface-container-lowest border border-outline-variant divide-y divide-outline-variant overflow-hidden">
      {rows.map((r) => {
        const name = (
          <>
            {r.displayName}
            {r.isMe && <span className="ml-xs text-label-sm font-normal text-on-surface-variant">(you)</span>}
          </>
        );
        return (
          <li key={`${r.rank}-${r.userId ?? r.displayName}`} className={`flex items-center gap-md px-lg py-sm ${r.isMe ? "bg-primary-fixed/40" : ""}`}>
            <span
              className={`w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-[50%] text-label-md font-bold tabular-nums ${
                r.rank <= 3 ? MEDALS[r.rank - 1] : "text-on-surface-variant"
              }`}
            >
              {r.rank}
            </span>
            <Avatar src={r.avatarUrl} name={r.displayName} size={32} />
            {r.userId ? (
              <Link href={`/profile/${r.userId}`} className="flex-1 min-w-0 truncate text-body-md font-semibold text-on-surface hover:text-primary">
                {name}
              </Link>
            ) : (
              <span className="flex-1 min-w-0 truncate text-body-md font-semibold text-on-surface">{name}</span>
            )}
            <span className="shrink-0 text-body-md font-semibold text-on-surface tabular-nums">{r.points.toLocaleString()} pts</span>
          </li>
        );
      })}
    </ol>
  );
}

// Contribution: users.points, earned for sharing resources and articles and
// for the likes, downloads and views they get.
async function ContributionBoard({ page }: { page: number }) {
  const signedIn = !!(await getCurrentUserId());
  let board: LeaderboardPage | null = null;
  let me: { points: number; rank: number | null; hidden: boolean } | null = null;
  try {
    [board, me] = await Promise.all([getContributionBoard(page, PAGE_SIZE), signedIn ? getMyContribution() : Promise.resolve(null)]);
  } catch {
    board = null;
  }
  const pages = board ? Math.max(1, Math.ceil(board.total / PAGE_SIZE)) : 1;

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-lg">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Leaderboard</h1>
        <p className="text-body-lg text-on-surface-variant">
          Contribution points come from sharing: posting resources and articles, and the likes, downloads and views they get.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-md">
        <BoardTabs current="contribution" />
        <Link href="/resources/upload" className="text-label-md font-semibold text-primary hover:underline">
          Share a resource →
        </Link>
      </div>

      {me ? (
        <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-wrap items-center justify-between gap-md" aria-label="Your standing">
          <div className="flex flex-col">
            <span className="text-label-md text-on-surface-variant">Your contribution</span>
            <span className="font-serif font-bold text-headline-md text-on-surface tabular-nums">
              {me.hidden ? `${me.points.toLocaleString()} points` : me.rank ? `#${me.rank} · ${me.points.toLocaleString()} points` : "No points yet"}
            </span>
            {!me.hidden && !me.rank && (
              <Link href="/resources/upload" className="text-label-md font-semibold text-primary hover:underline">
                Share a resource to get on the board →
              </Link>
            )}
          </div>
          <HideToggle hidden={me.hidden} />
        </section>
      ) : (
        !signedIn && (
          <p className="text-body-md text-on-surface-variant">
            <Link href="/login?next=/leaderboard?period=contribution" className="font-semibold text-primary hover:underline">
              Log in
            </Link>{" "}
            and share something to get on the board.
          </p>
        )
      )}

      {!board ? (
        <p className="text-body-md text-on-surface-variant">The leaderboard isn&apos;t available right now.</p>
      ) : board.rows.length === 0 ? (
        <p className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-xl text-center text-body-md text-on-surface-variant">
          Nobody has contribution points yet.
        </p>
      ) : (
        <Rows rows={board.rows} />
      )}

      {board && pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-center gap-md">
          {page > 1 && (
            <Link href={boardHref("contribution", page - 1)} className="text-label-md font-semibold text-primary hover:underline">
              ← Previous
            </Link>
          )}
          <span className="text-label-md text-on-surface-variant tabular-nums">
            Page {page} of {pages}
          </span>
          {page < pages && (
            <Link href={boardHref("contribution", page + 1)} className="text-label-md font-semibold text-primary hover:underline">
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
