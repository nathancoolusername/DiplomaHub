"use client";

import { useEffect, useState } from "react";
import { Maximize2, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { formatTimer, getRemainingMs, type TimerState } from "./timer";

export default function FocusTimerCard({
  timerState,
  taskTitle,
  onStartOrResume,
  onPause,
  onReset,
  onEnterFocusMode,
}: {
  timerState: TimerState;
  taskTitle: string | null;
  onStartOrResume: () => void;
  onPause: () => void;
  onReset: () => void;
  onEnterFocusMode: () => void;
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Re-sync `now` right after start/pause/resume/reset (startedAt changes)
  // without calling the impure Date.now() directly during render, and keep
  // it ticking once a second while running so the countdown stays live.
  // Deferring the resync through setTimeout keeps the setState call inside a
  // callback rather than the effect body itself.
  useEffect(() => {
    const resync = setTimeout(() => setNowMs(Date.now()), 0);
    return () => clearTimeout(resync);
  }, [timerState.startedAt, timerState.status]);

  useEffect(() => {
    if (timerState.status !== "running") return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timerState.status]);

  const remainingMs = getRemainingMs(timerState, nowMs);
  const isRunning = timerState.status === "running";
  const isComplete = timerState.status === "complete";

  let statusLabel = "Ready to engage";
  if (isRunning) statusLabel = taskTitle ? `Focusing on ${taskTitle}` : "Focusing";
  else if (timerState.status === "paused") statusLabel = "Paused";
  else if (isComplete) statusLabel = "Session complete — nice work";

  return (
    <div
      data-tour="timer"
      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col justify-between gap-sm h-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Timer size={18} className="text-primary-container" />
          <span className="text-label-md font-bold text-on-surface">Focus Timer</span>
        </div>
        <span className="px-sm py-1 rounded-full bg-surface-container text-label-sm text-on-surface-variant font-medium">
          Pomodoro 25m
        </span>
      </div>

      {/* flex-wrap — this card can end up quite narrow (e.g. the 3-of-12
          grid column it sits in on an iPad-width layout), and without it
          the button group's shrink-0 refusal to shrink just pushed the
          buttons over the top of the (also-shrinking) countdown text
          instead of dropping to its own line. */}
      <div className="flex flex-wrap items-center justify-between gap-sm bg-surface-container-low py-sm px-md rounded-lg border border-outline-variant/50">
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-headline-lg font-bold tracking-tight text-on-surface tabular-nums">
            {formatTimer(remainingMs)}
          </span>
          <span
            className={`text-[11px] font-medium flex items-center gap-1 truncate ${isComplete ? "text-primary" : "text-secondary"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${isComplete ? "bg-primary" : "bg-secondary"}`}
              aria-hidden="true"
            />
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={isRunning ? onPause : onStartOrResume}
            className="bg-primary hover:opacity-90 text-on-primary px-md py-1.5 rounded-lg text-label-md font-semibold flex items-center gap-1 shadow-sm transition-opacity cursor-pointer"
          >
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
            {isRunning ? "Pause" : timerState.status === "paused" ? "Resume" : "Start focus"}
          </button>
          <button
            type="button"
            onClick={onReset}
            aria-label="Reset timer"
            title="Reset timer"
            className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
          >
            <RotateCcw size={18} />
          </button>
          {timerState.status !== "idle" && (
            <button
              type="button"
              onClick={onEnterFocusMode}
              aria-label="Enter focus mode"
              title="Enter focus mode"
              className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
            >
              <Maximize2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
