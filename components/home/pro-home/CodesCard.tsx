import Link from "next/link";
import { Gift, Share2, Ticket } from "lucide-react";
import type { SharingStats } from "@/lib/data";

/**
 * Codes on Home: a "Got a code?" box (a plain GET form to /codes?c=…, where
 * the full redeem flow runs) and the way to share, with progress towards the
 * week of Pro until it's claimed. `stats` is null before migration 33 runs.
 */
export function CodesCard({ stats }: { stats: SharingStats | null }) {
  const done = stats ? Math.min(stats.friends, stats.goal) : 0;
  const showProgress = !!stats && !stats.claimedAt;

  return (
    <section
      aria-labelledby="home-codes"
      className="rounded-2xl bg-surface-container-lowest border border-outline-variant px-lg py-md grid md:grid-cols-2 gap-md md:gap-xl items-center"
    >
      <form action="/codes" method="get" className="flex flex-col gap-xs min-w-0">
        <label htmlFor="home-code" id="home-codes" className="flex items-center gap-sm text-label-md text-on-surface-variant">
          <Ticket size={16} className="text-primary" aria-hidden="true" />
          Got a code from a friend?
        </label>
        <div className="flex gap-sm">
          <input
            id="home-code"
            name="c"
            required
            minLength={5}
            maxLength={20}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="K7MPX"
            className="flex-1 min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm font-mono font-bold uppercase tracking-widest text-body-md text-on-surface placeholder:text-on-surface-variant/50"
          />
          <button type="submit" className="shrink-0 rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 cursor-pointer">
            Open
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-xs min-w-0 md:border-l md:border-outline-variant md:pl-xl">
        <p className="flex items-center gap-sm text-label-md text-on-surface-variant">
          {showProgress ? <Gift size={16} className="text-primary" aria-hidden="true" /> : <Share2 size={16} className="text-primary" aria-hidden="true" />}
          {showProgress
            ? stats.canClaim
              ? "Your week of Pro is ready to claim"
              : `Share with ${stats.goal} students, get a week of Pro`
            : "Revising with friends?"}
        </p>
        {showProgress && !stats.canClaim && (
          <div className="flex items-center gap-xs" role="img" aria-label={`${done} of ${stats.goal} students so far`}>
            {Array.from({ length: stats.goal }, (_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < done ? "bg-primary" : "bg-surface-container-high"}`} />
            ))}
            <span className="ml-xs text-label-sm text-on-surface-variant tabular-nums">
              {done}/{stats.goal}
            </span>
          </div>
        )}
        <p className="text-body-md text-on-surface">
          {showProgress && stats.canClaim ? (
            <Link href="/codes" className="font-semibold text-primary hover:underline">
              Claim it on Codes →
            </Link>
          ) : (
            <>
              Share a set or your revision plan with one code.{" "}
              <Link href="/codes" className="font-semibold text-primary hover:underline whitespace-nowrap">
                Codes →
              </Link>
            </>
          )}
        </p>
      </div>
    </section>
  );
}
