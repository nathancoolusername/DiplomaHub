import { STRENGTH_LABELS, STRENGTH_LEVELS } from "@/lib/practice/strength";

export function StrengthLegend({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-md gap-y-xs text-label-sm text-on-surface-variant ${className}`}>
      {[...STRENGTH_LEVELS.slice(1), STRENGTH_LEVELS[0]].map((level) => (
        <li key={level} className="flex items-center gap-xs">
          <span data-level={level} className="strength-tile w-3.5 h-3.5 rounded" aria-hidden="true" />
          {STRENGTH_LABELS[level]}
        </li>
      ))}
    </ul>
  );
}
