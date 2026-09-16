"use client";

import Link from "next/link";
import { CalendarSync, ChevronLeft, ChevronRight, Plus, Upload, UserRound } from "lucide-react";
import SessionPicker from "./session-picker";

function getGreeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HubHeader({
  firstName,
  isGuest,
  deadlineCount,
  view,
  onChangeView,
  currentDate,
  weekDates,
  onPrev,
  onNext,
  onToday,
  onAddItem,
  onSyncCalendar,
  onImport,
  session,
  onChangeSession,
}: {
  firstName: string | null;
  isGuest: boolean;
  deadlineCount: number;
  view: "week" | "month";
  onChangeView: (view: "week" | "month") => void;
  currentDate: Date;
  weekDates: Date[];
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddItem: () => void;
  onSyncCalendar: () => void;
  onImport: () => void;
  session: string;
  onChangeSession: (session: string) => void;
}) {
  const now = new Date();
  const rangeLabel =
    view === "week"
      ? `${weekDates[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
      : currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-md bg-surface-container-lowest p-lg rounded-xl border border-outline-variant">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-sm flex-wrap">
          <h1 className="text-headline-lg font-serif font-bold text-on-surface">
            {getGreeting(now)}{firstName ? `, ${firstName}` : ""}
          </h1>
          {isGuest && (
            <Link
              href="/login?next=/hub"
              className="inline-flex items-center gap-1 px-sm py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-label-sm font-semibold hover:opacity-80 transition-opacity"
            >
              <UserRound size={12} />
              Guest mode — sign in to save
            </Link>
          )}
        </div>
        {/* A div, not a <p> — SessionPicker's dropdown renders a <div>, and a
            <div> can never legally be a descendant of a <p> (the browser
            silently closes the <p> early, causing a real hydration
            mismatch). This is just a status line, not semantic paragraph
            text, so a div loses nothing. */}
        <div className="text-body-sm text-on-surface-variant flex items-center gap-sm flex-wrap">
          <span>
            {deadlineCount} deadline{deadlineCount === 1 ? "" : "s"} this week
          </span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" aria-hidden="true" />
          <SessionPicker value={session} onChange={onChangeSession} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-sm">
        <div className="inline-flex p-1 rounded-lg bg-surface-container text-on-surface-variant text-label-md">
          <button
            type="button"
            onClick={() => onChangeView("week")}
            aria-pressed={view === "week"}
            className={`px-sm py-1 rounded-md font-semibold transition-all cursor-pointer ${
              view === "week" ? "bg-surface-container-lowest text-primary shadow-xs" : "hover:text-primary"
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => onChangeView("month")}
            aria-pressed={view === "month"}
            className={`px-sm py-1 rounded-md font-semibold transition-all cursor-pointer ${
              view === "month" ? "bg-surface-container-lowest text-primary shadow-xs" : "hover:text-primary"
            }`}
          >
            Month
          </button>
        </div>

        <div className="flex items-center gap-1 bg-surface-container-low px-1 py-1 rounded-lg border border-outline-variant/50">
          <button
            type="button"
            onClick={onPrev}
            aria-label={view === "week" ? "Previous week" : "Previous month"}
            className="w-7 h-7 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="px-sm py-1 text-label-sm font-bold text-primary hover:bg-surface-container rounded transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label={view === "week" ? "Next week" : "Next month"}
            className="w-7 h-7 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
          <span className="ml-1 pl-sm border-l border-outline-variant/50 text-label-md text-on-surface font-medium whitespace-nowrap">
            {rangeLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={onImport}
          className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant px-md py-2 rounded-lg text-label-md font-semibold transition-colors cursor-pointer"
        >
          <Upload size={18} />
          Import
        </button>

        <button
          type="button"
          onClick={onSyncCalendar}
          className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant px-md py-2 rounded-lg text-label-md font-semibold transition-colors cursor-pointer"
        >
          <CalendarSync size={18} />
          Sync to calendar
        </button>

        <button
          type="button"
          onClick={onAddItem}
          className="flex items-center gap-1.5 bg-primary hover:opacity-90 text-on-primary px-md py-2 rounded-lg text-label-md font-semibold shadow-sm transition-opacity cursor-pointer"
        >
          <Plus size={18} />
          Add item
        </button>
      </div>
    </header>
  );
}
