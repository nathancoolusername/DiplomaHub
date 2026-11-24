import { Trophy } from "lucide-react";
import { MAX_EXTENSIONS, TIERS } from "@/lib/deadline/config";
import type { RoomPlayer } from "@/lib/deadline/types";

export const nameOf = (p: Pick<RoomPlayer, "name"> | undefined | null) => p?.name?.trim() || "Someone";

/** 🏆 lifetime wins: on seats, the lobby, profile and squad board. */
export function WinsBadge({ wins, className = "" }: { wins: number; className?: string }) {
  if (!wins) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full bg-tertiary-container text-on-tertiary-container px-1.5 text-label-sm font-semibold tabular-nums ${className}`}
      title={`${wins} Deadline win${wins === 1 ? "" : "s"}`}>
      <Trophy size={11} aria-hidden="true" />
      {wins}
      <span className="sr-only"> wins</span>
    </span>
  );
}

/** Extensions left, as pips out of the max. */
export function Extensions({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} role="img" aria-label={`${n} extension${n === 1 ? "" : "s"} left`}>
      {Array.from({ length: MAX_EXTENSIONS }, (_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < n ? "bg-primary" : "bg-outline-variant/60"}`} />
      ))}
    </span>
  );
}

/** +N in its tier colour. */
export function Points({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`font-bold tabular-nums ${className}`} style={{ color: TIERS[n]?.color }}>
      +{n}
    </span>
  );
}
