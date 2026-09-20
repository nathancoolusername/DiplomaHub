"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bookmark, BookmarkCheck, ChevronDown, Maximize, Minimize, Minimize2, Pause, Play, Square } from "lucide-react";
import type { Resource } from "@/app/lib/types";
import type { CustomSubject, HubItem } from "./mock-data";
import { getSubject } from "./mock-data";
import { getSubjectColor } from "./subject-colors";
import { formatTimer, getRemainingMs, type TimerState } from "./timer";

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export default function FocusMode({
  timerState,
  task,
  sessionNumber,
  totalSessions,
  resources,
  savedResourceIds,
  onToggleSaveResource,
  onPause,
  onResume,
  onEnd,
  onMinimize,
  customSubjects = [],
}: {
  timerState: TimerState;
  task: HubItem | null;
  sessionNumber: number;
  totalSessions: number;
  resources: Resource[];
  savedResourceIds: Set<string>;
  onToggleSaveResource: (id: string) => void;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onMinimize: () => void;
  customSubjects?: CustomSubject[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [resourcesOpen, setResourcesOpen] = useState(false);
  // hub.tsx already best-effort requests fullscreen (on document.documentElement,
  // not this element) the moment focus mode opens, in the same click that
  // triggered it — this just mirrors whatever the browser actually granted,
  // reading the current state directly for the very first render so the
  // icon is right even before the first fullscreenchange event arrives.
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== "undefined" && !!document.fullscreenElement,
  );

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Manual fallback/toggle for whenever the automatic request on open was
  // refused (Safari's stricter activation rules, an embedded iframe without
  // allow="fullscreen") or the viewer wants to drop back out without fully
  // minimizing. Always targets documentElement, matching what hub.tsx
  // requests on open, so exit/enter never target mismatched elements.
  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
  }

  // Same resync-then-tick pattern as FocusTimerCard, so the two stay in
  // lockstep even though each keeps its own independent `now` clock.
  useEffect(() => {
    const resync = setTimeout(() => setNowMs(Date.now()), 0);
    return () => clearTimeout(resync);
  }, [timerState.startedAt, timerState.status]);

  useEffect(() => {
    if (timerState.status !== "running") return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timerState.status]);

  // A full-screen "mode" rather than a task-scoped dialog — Escape backs
  // out to the normal view (mirrors the minimize button) instead of ending
  // the running session, which would be a much more destructive surprise.
  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null;
    getFocusable(rootRef.current)[0]?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // If real fullscreen is active, let the browser's own Escape handling
      // exit that first — peel back one layer at a time rather than also
      // closing focus mode in the same keystroke.
      if (document.fullscreenElement) return;
      onMinimize();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remainingMs = getRemainingMs(timerState, nowMs);
  const isRunning = timerState.status === "running";
  const isComplete = timerState.status === "complete";

  let statusLabel = "Ready to engage";
  if (isRunning) statusLabel = "Focusing";
  else if (timerState.status === "paused") statusLabel = "Paused";
  else if (isComplete) statusLabel = "Session complete — nice work";

  const subject = task ? getSubject(task.subjectId, customSubjects) : null;
  const color = task ? getSubjectColor(task.subjectId) : null;
  const shownResources = resources.slice(0, 4);

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Focus mode"
      className="fixed inset-0 z-100 bg-surface overflow-y-auto flex flex-col items-center justify-center"
    >
      <div className="absolute top-md right-md flex items-center gap-1 z-10">
        {typeof document !== "undefined" && document.fullscreenEnabled && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="p-sm rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        )}
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize focus mode"
          title="Minimize"
          className="p-sm rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
        >
          <Minimize2 size={20} />
        </button>
      </div>

      {/* Centering lives on the outer fixed element itself (matching
          AddItemDialog's proven pattern) — flex centering plus
          overflow-y-auto on the same element works fine and falls back to
          scrolling if content ever exceeds one screen; wrapping it in an
          extra sized child was the fragile part, not overflow-auto itself. */}
      <div className="w-full max-w-[36rem] mx-auto px-md py-xl flex flex-col items-center gap-xl text-center">
        <span className="text-label-sm font-semibold text-on-surface-variant bg-surface-container-low px-md py-1.5 rounded-full">
          Session {sessionNumber} of {totalSessions}
        </span>

        <div className="flex flex-col items-center gap-sm">
          <span className="font-serif text-[clamp(4.5rem,16vw,9rem)] leading-none font-bold tracking-tight text-on-surface tabular-nums">
            {formatTimer(remainingMs)}
          </span>
          <span
            className={`text-label-md font-medium flex items-center gap-1.5 ${isComplete ? "text-primary" : "text-secondary"}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isComplete ? "bg-primary" : "bg-secondary"}`}
              aria-hidden="true"
            />
            {statusLabel}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-headline-md font-semibold text-on-surface">
            {task ? task.title : "Free focus session"}
          </span>
          {subject && color && (
            <span
              className="inline-flex items-center gap-1.5 text-label-sm font-bold uppercase tracking-wide"
              style={{ color: color.base }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color.base }} aria-hidden="true" />
              {subject.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={isRunning ? onPause : onResume}
            disabled={isComplete}
            className="bg-primary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-on-primary px-xl py-2.5 rounded-lg text-label-md font-semibold flex items-center gap-2 shadow-sm transition-opacity cursor-pointer"
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            {isRunning ? "Pause" : "Resume"}
          </button>
          <button
            type="button"
            onClick={onEnd}
            className="px-xl py-2.5 rounded-lg border border-outline-variant text-label-md font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Square size={16} />
            End
          </button>
        </div>

        {shownResources.length > 0 && (
          <div className="w-full flex flex-col items-center gap-sm">
            <button
              type="button"
              onClick={() => setResourcesOpen((v) => !v)}
              aria-expanded={resourcesOpen}
              className="flex items-center gap-1.5 text-label-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <ChevronDown size={16} className={`transition-transform ${resourcesOpen ? "rotate-180" : ""}`} />
              Helpful resources ({shownResources.length})
            </button>

            {resourcesOpen && (
              <div className="w-full flex flex-col gap-sm text-left">
                {shownResources.map((resource) => {
                  const saved = savedResourceIds.has(resource.id);
                  return (
                    <div
                      key={resource.id}
                      className="p-md rounded-lg bg-surface-container-low border border-outline-variant/50 flex items-start justify-between gap-md"
                    >
                      <Link
                        href={`/resources/${resource.id}`}
                        className="flex flex-col min-w-0 gap-1 group"
                      >
                        <span className="text-label-sm font-bold uppercase tracking-wide text-secondary">
                          {resource.type_tag}
                        </span>
                        <span className="text-body-lg font-semibold text-on-surface leading-snug group-hover:text-primary transition-colors">
                          {resource.title}
                        </span>
                        {resource.description && (
                          <span className="text-body-md text-on-surface-variant line-clamp-2">
                            {resource.description}
                          </span>
                        )}
                      </Link>
                      <button
                        type="button"
                        onClick={() => onToggleSaveResource(resource.id)}
                        aria-label={saved ? "Remove from saved resources" : "Save resource"}
                        aria-pressed={saved}
                        className="p-1 text-outline hover:text-primary transition-colors cursor-pointer shrink-0"
                      >
                        {saved ? <BookmarkCheck size={20} className="text-primary" /> : <Bookmark size={20} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
