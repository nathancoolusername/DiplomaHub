import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { UsageItem } from "@/lib/data/types";
import { links } from "@/lib/practice/links";
import { PRO_COMING_SOON } from "@/lib/plans";

function pill(item: UsageItem) {
  const limit = item.limit === null ? "∞" : item.limit;
  const period = item.period === "week" ? "this week" : "this month";
  return `${item.label} ${item.used} / ${limit} ${period}`;
}

/** Pro: remaining caps per feature. Free: the free limits and an upgrade link. */
export function UsageBanner({ usage, isPro }: { usage: UsageItem[]; isPro: boolean }) {
  // Nothing is capped while DiplomaPro is coming soon: just point at the waitlist.
  if (PRO_COMING_SOON && usage.length === 0) {
    return (
      <div className="rounded-2xl px-lg py-md flex flex-wrap items-center gap-sm bg-surface-container-lowest border border-outline-variant text-on-surface">
        <span className="inline-flex items-center gap-xs font-serif font-bold mr-sm">
          <Sparkles size={16} aria-hidden="true" />
          DiplomaPro is coming soon
        </span>
        <span className="text-body-md text-on-surface-variant">Practice is free for now.</span>
        <Link href={links.plans()} className="ml-auto text-label-md font-semibold text-primary hover:underline">
          Join the waitlist
        </Link>
      </div>
    );
  }
  return (
    <div
      className={`rounded-2xl px-lg py-md flex flex-wrap items-center gap-sm ${
        isPro ? "bg-primary text-on-primary" : "bg-surface-container-lowest border border-outline-variant text-on-surface"
      }`}
    >
      <span className="inline-flex items-center gap-xs font-serif font-bold mr-sm">
        <Sparkles size={16} aria-hidden="true" />
        {isPro ? "DiplomaPro" : "Free plan"}
      </span>
      <ul className="flex flex-wrap gap-xs">
        {usage.map((item) => {
          const atLimit = item.limit !== null && item.used >= item.limit;
          return (
            <li
              key={item.feature}
              title={`Resets ${new Date(item.resetsAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`}
              className={`rounded-full px-sm py-xs text-label-sm font-medium tabular-nums ${
                isPro
                  ? "bg-on-primary/15"
                  : atLimit
                    ? "bg-error-container text-on-error-container"
                    : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {pill(item)}
            </li>
          );
        })}
      </ul>
      {!isPro && (
        <Link href={links.plans()} className="ml-auto text-label-md font-semibold text-primary hover:underline">
          Get DiplomaPro
        </Link>
      )}
    </div>
  );
}
