"use client";

import { useNow } from "./use-now";

// Morning 05:00–11:59, afternoon 12:00–17:59, evening 18:00–04:59, in the
// student's local time — hence a client component.
function period(hour: number) {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

export function Greeting({
  firstName,
  variant = "time",
  className = "",
}: {
  firstName: string;
  /** "time": Good morning/afternoon/evening (Home). "practice": Lock in time (Practice). */
  variant?: "time" | "practice";
  className?: string;
}) {
  const now = useNow();
  const text =
    variant === "practice"
      ? `Lock in time, ${firstName}`
      : now === null
        ? null
        : `Good ${period(new Date(now).getHours())}, ${firstName}`;

  return (
    <h1 className={`font-serif font-bold text-headline-lg md:text-display-lg text-on-surface ${className}`}>
      {/* Invisible placeholder keeps the height until the local time is known. */}
      {text ?? <span className="invisible">Good afternoon, {firstName}</span>}
    </h1>
  );
}
