"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { CalendarCheck, RotateCcw } from "lucide-react";
import { isResetDay, resetWeekStart } from "@/lib/reset-week";

const noop = () => () => {};

/**
 * The way into the Sunday Reset (Hub and Home). On Saturday, Sunday and
 * Monday it's a card that invites you to plan the week; once this week is
 * done, or on other days, it's a quiet line. Worked out in the browser, since
 * "Sunday" is the student's Sunday.
 */
export function ResetBanner({ doneWeeks, previewDate }: { doneWeeks: string[]; /** /dev/reset: pretend it is this day. */ previewDate?: string }) {
  // null on the server: render nothing until the browser knows the day.
  const today = useSyncExternalStore(noop, () => new Date().toDateString(), () => null);
  if (!today) return null;
  const now = previewDate ? new Date(`${previewDate}T10:00:00`) : new Date();
  const done = doneWeeks.includes(resetWeekStart(now));

  if (done)
    return (
      <p className="flex items-center gap-xs text-label-md text-on-surface-variant">
        <CalendarCheck size={16} className="text-primary" aria-hidden="true" /> This week is planned.
        <Link href="/hub/reset" className="font-semibold text-primary hover:underline">
          Open your Sunday Reset
        </Link>
      </p>
    );

  if (!isResetDay(now))
    return (
      <p className="flex items-center gap-xs text-label-md text-on-surface-variant">
        <RotateCcw size={14} aria-hidden="true" />
        <Link href="/hub/reset" className="font-semibold text-primary hover:underline">
          Plan your week
        </Link>
        <span>· 10 minutes, any day</span>
      </p>
    );

  return (
    <Link
      href="/hub/reset"
      className="group flex items-center gap-md rounded-2xl bg-primary-fixed text-on-primary-fixed border border-primary/20 px-lg py-md hover:border-primary"
    >
      <span className="w-11 h-11 shrink-0 rounded-2xl bg-primary text-on-primary flex items-center justify-center" aria-hidden="true">
        <RotateCcw size={20} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-serif font-bold text-headline-md">Sunday Reset</span>
        <span className="block text-body-md opacity-90">Ten minutes: look back at last week, see what&apos;s coming, and put three short sessions where they count.</span>
      </span>
      <span className="shrink-0 rounded-lg bg-primary text-on-primary px-md py-sm text-label-lg font-semibold group-hover:bg-primary/90">Start</span>
    </Link>
  );
}
