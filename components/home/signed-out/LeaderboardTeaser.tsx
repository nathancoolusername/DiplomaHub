import Link from "next/link";
import { Trophy } from "lucide-react";

// Static on purpose (the signed-out homepage is cached for everyone): just a
// way in to the public leaderboard, no live numbers.
export default function LeaderboardTeaser() {
  return (
    <section className="px-md py-xl" aria-label="Leaderboard">
      <Link
        href="/leaderboard"
        prefetch={false}
        className="max-w-[1000px] mx-auto rounded-2xl bg-surface-container-lowest border border-outline-variant px-lg py-md flex flex-wrap items-center gap-md hover:border-primary transition-colors"
      >
        <span className="inline-flex shrink-0 items-center justify-center rounded-[50%] bg-secondary-container text-on-secondary-container w-10 h-10" aria-hidden="true">
          <Trophy size={18} />
        </span>
        <span className="flex-1 min-w-0 text-body-lg text-on-surface">Every finished set earns points. See who&apos;s practising most this week.</span>
        <span className="shrink-0 text-label-md font-semibold text-primary">Leaderboard →</span>
      </Link>
    </section>
  );
}
