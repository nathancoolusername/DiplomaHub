import { Timer } from "lucide-react";
import { formatClock, isOnPace } from "@/lib/practice/pace";

/**
 * Exam pace: time left for the whole set plus an on-pace / behind pill.
 * Timer off: just the elapsed time, quietly.
 */
export function PlayerTimer({
  timed,
  elapsedS,
  examPaceS,
  marksAttempted,
  marksTotal,
}: {
  timed: boolean;
  elapsedS: number;
  examPaceS: number;
  marksAttempted: number;
  marksTotal: number;
}) {
  if (!timed) {
    return (
      <span className="inline-flex items-center gap-xs text-label-md text-on-surface-variant tabular-nums" aria-label="Time elapsed">
        <Timer size={14} aria-hidden="true" /> {formatClock(elapsedS)}
      </span>
    );
  }

  const left = examPaceS - elapsedS;
  const onPace = isOnPace(elapsedS, examPaceS, marksAttempted, marksTotal);
  return (
    <span className="inline-flex items-center gap-sm">
      <span
        className={`inline-flex items-center gap-xs font-semibold tabular-nums ${left < 0 ? "text-error" : "text-on-surface"}`}
        aria-label="Time left at exam pace"
      >
        <Timer size={16} aria-hidden="true" />
        {left >= 0 ? `${formatClock(left)} left` : `${formatClock(-left)} over`}
      </span>
      <span
        className={`rounded-full px-sm py-px text-label-sm font-semibold ${
          onPace ? "bg-secondary-container text-on-secondary-container" : "bg-tertiary-container text-on-tertiary-container"
        }`}
      >
        {onPace ? "On pace" : "Behind"}
      </span>
    </span>
  );
}
