import Link from "next/link";
import { Trophy } from "lucide-react";
import type { LeaderboardStanding } from "@/lib/data/types";

/** "Your rank this week" (Practice and Home), linking to the leaderboard. */
export function RankCard({ standing }: { standing: LeaderboardStanding }) {
  const { points, rank, total, hidden } = standing;
  return (
    <Link
      href="/leaderboard"
      className="rounded-2xl bg-surface-container-lowest border border-outline-variant px-lg py-md flex items-center gap-md hover:border-primary transition-colors"
    >
      <span className="inline-flex shrink-0 items-center justify-center rounded-[50%] bg-secondary-container text-on-secondary-container w-10 h-10" aria-hidden="true">
        <Trophy size={18} />
      </span>
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="text-label-md text-on-surface-variant">Your rank this week</span>
        <span className="text-body-lg font-semibold text-on-surface tabular-nums">
          {hidden
            ? `${points} points · hidden from the leaderboard`
            : rank
              ? `#${rank} of ${total} · ${points} points`
              : "Finish a set to get on this week's leaderboard"}
        </span>
      </span>
      <span className="shrink-0 text-label-md font-semibold text-primary">Leaderboard →</span>
    </Link>
  );
}
