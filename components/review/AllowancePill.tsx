import type { ReviewAllowance } from "@/lib/data/supabase/reviews";

/** "4 of 6 reviews left this month · resets 1 Dec". */
export function AllowancePill({ allowance }: { allowance: ReviewAllowance }) {
  if (allowance.cap === null) return <span className="text-label-md text-on-surface-variant">Unlimited reviews</span>;
  const resets = new Date(allowance.resetsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return (
    <span className="inline-flex items-center gap-xs rounded-full bg-surface-container px-md py-xs text-label-md text-on-surface">
      <span className="font-semibold tabular-nums">
        {allowance.remaining} of {allowance.cap}
      </span>
      reviews left this month · resets {resets}
    </span>
  );
}
