import Link from "next/link";
import type { StrengthLevel } from "@/lib/data/types";
import { STRENGTH_LABELS } from "@/lib/practice/strength";

/**
 * One subtopic. Shading comes from .strength-tile[data-level] in
 * globals.css (per-theme opacities); the level word is in the tooltip and
 * aria-label so colour is never the only signal.
 */
export function StrengthTile({
  code,
  name,
  shortName,
  level,
  href,
  size = "compact",
}: {
  code: string;
  /** Full name: used in the tooltip and aria-label. */
  name: string;
  /** Shown on full-size tiles; defaults to name. */
  shortName?: string;
  level: StrengthLevel;
  href?: string;
  /** compact: code only (carousels). full: code + name (subject page). */
  size?: "compact" | "full";
}) {
  const label = `${code} ${name}: ${STRENGTH_LABELS[level]}`;
  const className = `strength-tile rounded-lg transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-primary ${
    size === "compact"
      ? "h-9 min-w-16 px-sm inline-flex items-center justify-center text-label-sm font-semibold tabular-nums"
      : "min-h-16 p-sm flex flex-col justify-between text-left"
  }`;

  const content =
    size === "compact" ? (
      code
    ) : (
      <>
        <span className="text-label-sm font-bold tabular-nums">{code}</span>
        <span className="text-label-sm leading-tight line-clamp-2">{shortName ?? name}</span>
      </>
    );

  return href ? (
    <Link href={href} title={label} aria-label={label} data-level={level} className={className}>
      {content}
    </Link>
  ) : (
    <span title={label} aria-label={label} data-level={level} className={className}>
      {content}
    </span>
  );
}
