"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, Copy, Loader2, RefreshCw, X } from "lucide-react";
import {
  getCalendarFeedStatus,
  generateCalendarFeed,
  updateCalendarFeedSettings,
} from "@/app/lib/actions/calendar-feed";

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export default function CalendarSyncDialog({
  isGuest,
  onClose,
}: {
  isGuest: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(!isGuest);
  const [feedExists, setFeedExists] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeStudyBlocks, setIncludeStudyBlocks] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null;
    getFocusable(dialogRef.current)[0]?.focus();
    return () => prevActive?.focus?.();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable(dialogRef.current);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (isGuest) return;
    let cancelled = false;
    getCalendarFeedStatus().then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setFeedExists(result.data.exists);
      setIncludeTasks(result.data.includeTasks);
      setIncludeStudyBlocks(result.data.includeStudyBlocks);
    });
    return () => {
      cancelled = true;
    };
  }, [isGuest]);

  function handleToggle(key: "tasks" | "studyBlocks", value: boolean) {
    const nextTasks = key === "tasks" ? value : includeTasks;
    const nextStudyBlocks = key === "studyBlocks" ? value : includeStudyBlocks;
    setIncludeTasks(nextTasks);
    setIncludeStudyBlocks(nextStudyBlocks);
    // Only an existing feed has settings worth persisting server-side —
    // before the first generate, these are just the values that generate
    // will be called with.
    if (feedExists) {
      updateCalendarFeedSettings(nextTasks, nextStudyBlocks).catch(console.error);
    }
  }

  async function handleGenerate() {
    if (feedExists) {
      const confirmed = window.confirm(
        "Generate a new link? The old one will stop working in any calendar app it's already added to.",
      );
      if (!confirmed) return;
    }
    setGenerating(true);
    setError(null);
    const result = await generateCalendarFeed(includeTasks, includeStudyBlocks);
    setGenerating(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setFeedExists(true);
    setGeneratedUrl(result.data.url);
    setCopied(false);
  }

  async function handleCopy() {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — clipboard access denied; the URL is still selectable text
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-md">
      <div className="absolute inset-0 bg-on-surface/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sync-calendar-title"
        className="relative bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl w-full max-w-140 max-h-[90vh] overflow-y-auto p-lg flex flex-col gap-md"
      >
        <div className="flex items-center justify-between">
          <h2 id="sync-calendar-title" className="text-headline-sm font-serif font-bold text-on-surface">
            Sync to calendar
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {isGuest ? (
          <div className="flex flex-col gap-sm py-sm">
            <p className="text-body-md text-on-surface-variant">
              Calendar sync saves to your account, so you&apos;ll need to sign in first.
            </p>
            <Link
              href="/login?next=/hub"
              className="self-start px-md py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:opacity-90 transition-opacity"
            >
              Sign in
            </Link>
          </div>
        ) : loading ? (
          <div className="flex items-center gap-sm py-lg justify-center text-on-surface-variant">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-body-md">Loading…</span>
          </div>
        ) : (
          <>
            {error && (
              <p className="text-label-md text-error bg-error-container/30 rounded-lg px-sm py-1.5">{error}</p>
            )}

            <div className="flex flex-col gap-sm">
              <p className="text-body-md text-on-surface-variant">
                Subscribe to your Hub from Google Calendar, Apple Calendar, or Outlook. IB assessments and
                university deadlines are always included.
              </p>

              <label className="flex items-start gap-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTasks}
                  onChange={(e) => handleToggle("tasks", e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-body-md text-on-surface">Include personal tasks</span>
              </label>
              <label className="flex items-start gap-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStudyBlocks}
                  onChange={(e) => handleToggle("studyBlocks", e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-body-md text-on-surface">Include study blocks</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="self-start flex items-center gap-1.5 px-md py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {feedExists ? "Generate new link" : "Generate link"}
            </button>

            {generatedUrl && (
              <div className="flex flex-col gap-1.5 p-sm rounded-lg bg-surface-container-low border border-outline-variant/50">
                <p className="text-label-sm font-bold text-primary">
                  Copy this now — it won&apos;t be shown again.
                </p>
                <div className="flex items-center gap-sm">
                  <input
                    readOnly
                    value={generatedUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 min-w-0 bg-surface-container-lowest border border-outline-variant rounded-md px-sm py-1.5 text-body-sm text-on-surface font-mono truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 flex items-center gap-1 px-sm py-1.5 rounded-md bg-surface-container hover:bg-surface-container-high text-label-sm font-semibold text-on-surface-variant transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-sm pt-sm border-t border-outline-variant/50">
              <span className="text-label-sm uppercase tracking-wide text-outline font-bold">
                Adding it to your calendar app
              </span>
              <div className="flex flex-col gap-2 text-body-sm text-on-surface-variant">
                <p>
                  <span className="font-semibold text-on-surface">Google Calendar:</span> Settings → Add
                  calendar → From URL, then paste the link above.
                </p>
                <p>
                  <span className="font-semibold text-on-surface">Apple Calendar:</span> File → New Calendar
                  Subscription, then paste the link.
                </p>
                <p>
                  <span className="font-semibold text-on-surface">Outlook:</span> Add calendar → Subscribe
                  from web, then paste the link.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-[11px] text-on-surface-variant">
              <p>
                This sync is one-way — changes you make in Google/Apple/Outlook won&apos;t appear back in the
                Hub. Calendar apps can take several hours to refresh, so don&apos;t rely on it for last-minute
                changes.
              </p>
              <p>Anyone with this link can see your event titles and times — treat it like a password.</p>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
