"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import type { CalendarItem, ExamSession } from "@/lib/data/types";
import { calendarDaysUntil, useNow } from "./use-now";

function daysLabel(days: number) {
  if (days <= 0) return "Today";
  return days === 1 ? "1 day" : `${days} days`;
}

/**
 * Home's countdown: the nearest item ticked "Show a countdown" (big), then
 * the exam session (small). With no timed item, the session goes big and
 * the card explains how to add one.
 */
export function Countdown({
  nextItem,
  session,
  addItemHref = "/hub?add=1",
}: {
  nextItem: CalendarItem | null;
  session: ExamSession | null;
  addItemHref?: string;
}) {
  const now = useNow();
  const ready = now !== null;
  const itemDays = ready && nextItem ? calendarDaysUntil(nextItem.startsAt, now) : null;
  const sessionDays = ready && session ? calendarDaysUntil(session.firstExamDate, now) : null;

  return (
    <div className="flex flex-col gap-xs md:items-end md:text-right">
      {nextItem ? (
        <>
          <p className="font-serif font-bold text-headline-lg text-primary leading-none">
            {itemDays === null ? " " : daysLabel(itemDays)}
          </p>
          <p className="text-body-md text-on-surface">
            {itemDays === 0 ? "" : "until "}
            <span className="font-semibold">{nextItem.title}</span>
          </p>
          {session && (
            <p className="text-label-md text-on-surface-variant mt-xs">
              {sessionDays === null ? " " : `${sessionDays} days until your final exams (${session.label})`}
            </p>
          )}
        </>
      ) : (
        <>
          {session && (
            <>
              <p className="font-serif font-bold text-headline-lg text-primary leading-none">
                {sessionDays === null ? " " : `${sessionDays} days`}
              </p>
              <p className="text-body-md text-on-surface">until your final exams ({session.label})</p>
            </>
          )}
          <p className="text-label-md text-on-surface-variant mt-sm max-w-80">
            Add a test and tick <span className="font-semibold">Show a countdown</span> to track it here.
          </p>
          <Link
            href={addItemHref}
            className="mt-xs inline-flex items-center gap-xs text-label-md font-semibold text-primary hover:underline"
          >
            <Plus size={14} aria-hidden="true" /> Add a test
          </Link>
        </>
      )}
    </div>
  );
}
