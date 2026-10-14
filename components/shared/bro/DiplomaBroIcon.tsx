"use client";

import { useId } from "react";
import styles from "./DiplomaBroIcon.module.css";

export type DiplomaBroState = "idle" | "thinking" | "answering" | "done" | "notification" | "locked";

// Ring: r = 32, circumference 2π·32 ≈ 201.06. A 52-unit gap (about 30 once
// the round caps take their share), rotated so it's centred on 1:30.
// "done" animates the dasharray to close it.
const RING_R = 32;
const RING_DASH = "149.06 52";
const RING_ROTATE = 1.55;
// Notification dot: in the gap, next to where the ring starts again.
const DOT_ANGLE = (-21 * Math.PI) / 180;
const DOT = { cx: 50 + RING_R * Math.cos(DOT_ANGLE), cy: 50 + RING_R * Math.sin(DOT_ANGLE) };

/** The DiplomaBro mark on its own (decorative). Glow switches off below 32px. */
export function DiplomaBroMark({ state = "idle", size = 40, className = "" }: { state?: DiplomaBroState; size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  const disc = `bro-disc-${id}`;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      data-state={state}
      data-glow={size >= 32 ? "on" : "off"}
      className={`${styles.icon} ${className}`}
    >
      <defs>
        <radialGradient id={disc} cx="38%" cy="32%" r="75%">
          <stop offset="0%" style={{ stopColor: "var(--bro-navy-light)" }} />
          <stop offset="100%" style={{ stopColor: "var(--bro-navy-dark)" }} />
        </radialGradient>
      </defs>

      {/* Disc with a thin lighter outline */}
      <circle cx="50" cy="50" r="47" fill={`url(#${disc})`} style={{ stroke: "var(--bro-outline)" }} strokeWidth="1.5" />

      {/* Thinking: two inner arcs of short dashes, counter-rotating */}
      <g className={styles.arcs} fill="none" strokeLinecap="round">
        <circle className={styles.arcOuter} cx="50" cy="50" r="20" strokeWidth="4.5" strokeDasharray="8 5 8 5 8 91.66" />
        <circle className={styles.arcInner} cx="50" cy="50" r="11" strokeWidth="4" strokeDasharray="6 4.5 6 52.62" />
      </g>

      {/* Thick ring with round caps and a gap at top-right */}
      <circle
        className={styles.ring}
        cx="50"
        cy="50"
        r={RING_R}
        fill="none"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={RING_DASH}
        transform={`rotate(${RING_ROTATE} 50 50)`}
      />

      {/* Notification dot at the gap's end */}
      <circle className={styles.dot} cx={DOT.cx.toFixed(2)} cy={DOT.cy.toFixed(2)} r="5.5" style={{ stroke: "var(--bro-navy-dark)" }} strokeWidth="2" />
    </svg>
  );
}

/** The DiplomaBro icon as a button ("Open DiplomaBro"). */
export function DiplomaBroIcon({
  state = "idle",
  size = 40,
  onClick,
  className = "",
  label = "Open DiplomaBro",
}: {
  state?: DiplomaBroState;
  size?: number;
  onClick?: () => void;
  className?: string;
  label?: string;
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={`${styles.button} ${className}`}>
      <DiplomaBroMark state={state} size={size} />
    </button>
  );
}
