"use client";

import { useState, useTransition } from "react";
import { Crown, Gift, Users } from "lucide-react";
import { claimShareRewardAction } from "@/app/codes/actions";
import { Spinner } from "@/components/spinner";

export type SharingRewardStats = {
  uses: number;
  friends: number;
  goal: number;
  rewardDays: number;
  claimedAt: string | null;
  canClaim: boolean;
};

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

/**
 * "Share with 3 students, get a week of Pro": progress, the claim button,
 * and how often your codes have been used. Counts only; never who.
 */
export function SharingReward({ stats, isUnlimited = false }: { stats: SharingRewardStats; isUnlimited?: boolean }) {
  const [claimedUntil, setClaimedUntil] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const done = Math.min(stats.friends, stats.goal);
  const claimed = !!stats.claimedAt || !!claimedUntil;

  const claim = () => {
    setError(null);
    start(async () => {
      const r = await claimShareRewardAction();
      if (r.ok) setClaimedUntil(r.expiresAt);
      else setError(r.error);
    });
  };

  return (
    <section aria-labelledby="sharing-reward" className="flex flex-col gap-md rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
      <div className="flex items-start gap-md">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-primary">
          <Gift size={20} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-xs min-w-0">
          <h2 id="sharing-reward" className="font-serif font-bold text-headline-sm text-on-surface">
            {claimed ? "You earned a week of Pro" : `Share with ${stats.goal} students, get a week of Pro`}
          </h2>
          <p className="text-body-md text-on-surface-variant">
            {claimed
              ? claimedUntil
                ? `Thanks for sharing. Your Pro now runs until ${longDate(claimedUntil)}.`
                : "Thanks for sharing. Keep going: every code you share helps someone revise."
              : `When ${stats.goal} different students redeem your set or Hub codes, you can claim ${stats.rewardDays} days of DiplomaPro, once. It adds on after any Pro you already have.`}
          </p>
        </div>
      </div>

      {!claimed && (
        <div className="flex flex-col gap-sm">
          <div className="flex items-center gap-sm" role="img" aria-label={`${done} of ${stats.goal} students so far`}>
            {Array.from({ length: stats.goal }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < done ? "bg-primary" : "bg-surface-container-high"}`} />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <p className="text-label-md text-on-surface-variant tabular-nums">
              {done} of {stats.goal} students
            </p>
            {stats.canClaim && !isUnlimited && (
              <button
                type="button"
                onClick={claim}
                disabled={busy}
                className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Spinner size={14} /> : <Crown size={16} aria-hidden="true" />}
                {busy ? "Claiming…" : `Claim ${stats.rewardDays} days of Pro`}
              </button>
            )}
            {stats.canClaim && isUnlimited && <p className="text-label-md text-on-surface-variant">You already have unlimited Pro.</p>}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-label-md text-error">
          {error}
        </p>
      )}

      <p className="flex items-center gap-xs border-t border-outline-variant pt-sm text-label-md text-on-surface-variant">
        <Users size={14} aria-hidden="true" />
        {stats.uses === 0
          ? "Nobody has used your codes yet."
          : `Your codes have been used ${stats.uses} time${stats.uses === 1 ? "" : "s"}.`}
      </p>
    </section>
  );
}
