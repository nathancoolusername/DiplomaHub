"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { ActionResult, Resource } from "@/app/lib/types";
import {
  createHubItem as createHubItemAction,
  updateHubItemTime as updateHubItemTimeAction,
  updateHubItemStages as updateHubItemStagesAction,
  updateHubItemStatus as updateHubItemStatusAction,
  updateHubItemNotes as updateHubItemNotesAction,
  updateHubItemDetails as updateHubItemDetailsAction,
  deleteHubItem as deleteHubItemAction,
  logStudySession as logStudySessionAction,
  bulkImportHubItems,
  bulkImportStudyLog,
  completeHubOnboarding as completeHubOnboardingAction,
  getHubItems,
  getHubStudyLog,
} from "@/app/lib/actions/hub";
import HubHeader from "./hub-header";
import TodayFocus from "./today-focus";
import MilestonesBar from "./milestones-bar";
import FocusTimerCard from "./focus-timer-card";
import FocusMode from "./focus-mode";
import WeekCalendar, { type PanelActions } from "./calendar/week-calendar";
import DayAgenda from "./day-agenda";
import MonthView from "./month-view";
import TaskDetailsPanel from "./task-details-panel";
import AddItemDialog from "./add-item-dialog";
import CalendarSyncDialog from "./calendar-sync-dialog";
import ImportDialog from "./import-dialog";
import { undoImportBatch } from "@/app/lib/actions/ics-import";
import UpcomingDeadlinesCard from "./upcoming-deadlines-card";
import StudyTimeCard from "./study-time-card";
import OnboardingWizard from "./onboarding/onboarding-wizard";
import EditSubjectsDialog from "./onboarding/edit-subjects-dialog";
import { computeMySubjectIds } from "./onboarding/subject-cap";
import { defaultHubSession } from "./format";
import {
  SUBJECTS,
  type CustomSubject,
  type HubItem,
  type HubItemStatus,
  type HubItemType,
  type SubjectId,
} from "./mock-data";
import { hubItemToRow, rowToHubItem, type HubItemRow } from "./hub-row";
import { getWeekDates, isSameDay, toDateInputValue } from "./calendar/calendar-utils";
import { INITIAL_TIMER_STATE, SESSIONS_PER_CYCLE, TIMER_DURATION_MS, type TimerState } from "./timer";

type StudyLogEntry = { log_date: string; hours: number };

type ItemsAction =
  | { type: "MOVE"; id: string; start: Date; end: Date }
  | { type: "RESIZE"; id: string; end: Date }
  | { type: "UPDATE_TIME"; id: string; start: Date; end: Date }
  | { type: "UPDATE_STAGE"; id: string; stageIndex: number }
  | { type: "TOGGLE_STATUS"; id: string }
  | { type: "ADD"; item: HubItem }
  | { type: "UPDATE_NOTES"; id: string; notes: string }
  | {
      type: "UPDATE_DETAILS";
      id: string;
      details: { title: string; type: HubItemType; subjectId: SubjectId | null; start: Date; end: Date };
    }
  | { type: "DELETE"; id: string }
  | { type: "SET_ALL"; items: HubItem[] };

function itemsReducer(state: HubItem[], action: ItemsAction): HubItem[] {
  switch (action.type) {
    case "MOVE":
    case "UPDATE_TIME":
      return state.map((i) => (i.id === action.id ? { ...i, start: action.start, end: action.end } : i));
    case "RESIZE":
      return state.map((i) => (i.id === action.id ? { ...i, end: action.end } : i));
    case "UPDATE_STAGE":
      return state.map((i) =>
        i.id === action.id
          ? {
              ...i,
              stages: i.stages.map((s, idx) => (idx === action.stageIndex ? { ...s, done: !s.done } : s)),
            }
          : i,
      );
    case "TOGGLE_STATUS":
      return state.map((i) =>
        i.id === action.id ? { ...i, status: i.status === "done" ? "todo" : "done" } : i,
      );
    case "ADD":
      return [...state, action.item];
    case "UPDATE_NOTES":
      return state.map((i) => (i.id === action.id ? { ...i, notes: action.notes } : i));
    case "UPDATE_DETAILS":
      return state.map((i) => (i.id === action.id ? { ...i, ...action.details } : i));
    case "DELETE":
      return state.filter((i) => i.id !== action.id);
    case "SET_ALL":
      return action.items;
    default:
      return state;
  }
}

const GUEST_ITEMS_KEY = "hub_guest_items";
const GUEST_STUDY_LOG_KEY = "hub_guest_study_log";
const GUEST_SUBJECTS_KEY = "hub_guest_subjects";
const GUEST_CUSTOM_SUBJECTS_KEY = "hub_guest_custom_subjects";
const GUEST_ONBOARDED_KEY = "hub_onboarded_guest";
const SESSION_OVERRIDE_KEY_PREFIX = "hub_session_override:";

export default function Hub({
  firstName,
  userId,
  ibYear,
  initialItems,
  initialStudyLog,
  hasOnboarded,
  hubSubjects,
  initialCustomSubjects,
  resourcesBySubject,
}: {
  firstName: string | null;
  userId: string | null;
  ibYear: string | null;
  initialItems: HubItem[];
  initialStudyLog: StudyLogEntry[];
  hasOnboarded: boolean;
  hubSubjects: SubjectId[] | null;
  initialCustomSubjects: CustomSubject[];
  resourcesBySubject: Record<SubjectId, Resource[]>;
}) {
  const [items, dispatch] = useReducer(itemsReducer, initialItems);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState<"week" | "month">("week");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [panelVariant, setPanelVariant] = useState<"panel" | "sheet">("panel");
  const [activeSubjectIds, setActiveSubjectIds] = useState<Set<SubjectId>>(
    () => new Set(SUBJECTS.map((s) => s.id)),
  );
  // The user's actual picks (raw, uncapped as stored) — null until they've
  // onboarded/picked something. Drives which subjects show up as chips and
  // in the Add Item dropdown; `activeSubjectIds` above is the separate,
  // ephemeral "currently toggled on" filter layered on top of it.
  const [chosenSubjectIds, setChosenSubjectIds] = useState<SubjectId[] | null>(hubSubjects);
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>(initialCustomSubjects);
  const [savedResourceIds, setSavedResourceIds] = useState<Set<string>>(() => new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HubItem | null>(null);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importToast, setImportToast] = useState<{ batchId: string; count: number } | null>(null);
  const [undoingImport, setUndoingImport] = useState(false);
  // Every item mutation below applies an optimistic update first, then
  // persists in the background — this surfaces a visible error (rather than
  // the previous `.catch(console.error)`, which left a failed save looking
  // identical to a successful one) and re-syncs from the server so the UI
  // never keeps showing a change that didn't actually stick.
  const [actionError, setActionError] = useState<string | null>(null);
  const [isEditSubjectsOpen, setIsEditSubjectsOpen] = useState(false);
  const [timer, setTimer] = useState<TimerState>(INITIAL_TIMER_STATE);
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  // Per-task count of naturally-completed (not reset/ended-early) focus
  // sessions — ephemeral, not persisted, same "session-only" scope as the
  // timer itself (see Known limitations). Drives the "Session N of 4"
  // counter in focus mode.
  const [completedSessionsByTask, setCompletedSessionsByTask] = useState<Record<string, number>>({});
  const prevTimerStatusRef = useRef<TimerState["status"]>(timer.status);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showGuestSaveBanner, setShowGuestSaveBanner] = useState(false);
  const notesTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const mySubjectIds = useMemo(() => computeMySubjectIds(chosenSubjectIds), [chosenSubjectIds]);
  const mySubjects = useMemo(
    () => [
      ...SUBJECTS.filter((s) => mySubjectIds.has(s.id)),
      ...customSubjects
        .filter((s) => mySubjectIds.has(s.id))
        .map((s) => ({ id: s.id, name: s.name, shortName: s.name, hasResources: false })),
    ],
    [mySubjectIds, customSubjects],
  );

  function applyNewSubjects(subjectIds: SubjectId[] | null) {
    setChosenSubjectIds(subjectIds);
    setActiveSubjectIds(computeMySubjectIds(subjectIds));
  }

  // Almost everything below (mock data placement, the greeting, the
  // timezone label) is derived from "now" in the viewer's own local
  // timezone. The dev/prod server's system timezone can differ from the
  // browser's, so computing any of it during SSR risks a hydration
  // mismatch — gate the real content behind a client-only mount instead.
  const [mounted, setMounted] = useState(false);
  const [sessionOverride, setSessionOverride] = useState<string | null>(null);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const selectedItem = items.find((i) => i.id === selectedItemId) ?? null;

  // The study-time tracker is a running log of the real current week, kept
  // separate from `weekDates` (which follows calendar navigation) so
  // logging a session always lands on today regardless of which week the
  // planner happens to be showing.
  const [studyWeekDates] = useState<Date[]>(() => getWeekDates(new Date()));
  const [studyLogEntries, setStudyLogEntries] = useState<StudyLogEntry[]>(initialStudyLog);
  const studyLog = useMemo(
    () =>
      studyWeekDates.map((d) => {
        const dateStr = toDateInputValue(d);
        return studyLogEntries.find((e) => e.log_date === dateStr)?.hours ?? 0;
      }),
    [studyLogEntries, studyWeekDates],
  );

  // One-time client-only setup: guests hydrate from localStorage (server
  // has no access to it), signed-in users seed their filter from saved
  // subject picks, and either kind of first-timer gets the wizard. Every
  // setState call here is deferred into the timeout callback rather than
  // called directly in the effect body, matching the rest of this file's
  // pattern for satisfying React's "no synchronous setState in an effect"
  // rule while still resolving promptly (imperceptible delay).
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const rawSession = localStorage.getItem(SESSION_OVERRIDE_KEY_PREFIX + (userId ?? "guest"));
        if (rawSession) setSessionOverride(rawSession);
      } catch {
        // ignore
      }
      if (userId) {
        if (hubSubjects && hubSubjects.length > 0) {
          applyNewSubjects(hubSubjects);
        }
        if (!hasOnboarded) setShowOnboarding(true);
      } else {
        try {
          const rawItems = localStorage.getItem(GUEST_ITEMS_KEY);
          if (rawItems) {
            const rows = JSON.parse(rawItems) as HubItemRow[];
            dispatch({ type: "SET_ALL", items: rows.map(rowToHubItem) });
          }
          const rawLog = localStorage.getItem(GUEST_STUDY_LOG_KEY);
          if (rawLog) setStudyLogEntries(JSON.parse(rawLog) as StudyLogEntry[]);
          const rawSubjects = localStorage.getItem(GUEST_SUBJECTS_KEY);
          if (rawSubjects) {
            const subjects = JSON.parse(rawSubjects) as SubjectId[];
            if (subjects.length > 0) applyNewSubjects(subjects);
          }
          const rawCustomSubjects = localStorage.getItem(GUEST_CUSTOM_SUBJECTS_KEY);
          if (rawCustomSubjects) setCustomSubjects(JSON.parse(rawCustomSubjects) as CustomSubject[]);
          if (!localStorage.getItem(GUEST_ONBOARDED_KEY)) setShowOnboarding(true);
        } catch {
          // localStorage unavailable or corrupt — fall back to defaults
        }
      }
      setMounted(true);
    }, 0);
    return () => clearTimeout(id);
  }, [userId, hasOnboarded, hubSubjects]);

  // Guests: sync the whole local items/study-log state to localStorage
  // whenever it changes. One effect covers every mutation type (move,
  // resize, add, stage/status toggles, notes) instead of threading guest
  // branches through each individual handler below.
  useEffect(() => {
    if (!mounted || userId) return;
    try {
      localStorage.setItem(GUEST_ITEMS_KEY, JSON.stringify(items.map(hubItemToRow)));
    } catch {
      // storage unavailable (private mode, quota, etc.) — guest just loses persistence silently
    }
  }, [mounted, userId, items]);

  useEffect(() => {
    if (!mounted || userId) return;
    try {
      localStorage.setItem(GUEST_STUDY_LOG_KEY, JSON.stringify(studyLogEntries));
    } catch {
      // ignore
    }
  }, [mounted, userId, studyLogEntries]);

  // Guest → account migration: runs whenever Hub mounts with a real user id
  // and there's still unmigrated guest data sitting in localStorage.
  // Deliberately not tied to arriving via a specific redirect — a guest
  // could just as easily sign in elsewhere and visit /hub normally later.
  useEffect(() => {
    if (!mounted || !userId) return;
    const migratedKey = `hub_migrated_${userId}`;
    let cancelled = false;

    (async () => {
      let rawItems: string | null = null;
      let rawLog: string | null = null;
      try {
        if (localStorage.getItem(migratedKey)) return;
        rawItems = localStorage.getItem(GUEST_ITEMS_KEY);
        rawLog = localStorage.getItem(GUEST_STUDY_LOG_KEY);
        if (!rawItems && !rawLog) {
          localStorage.setItem(migratedKey, "1");
          return;
        }
      } catch {
        return;
      }

      const itemRows = rawItems ? (JSON.parse(rawItems) as HubItemRow[]) : [];
      const logEntries = rawLog ? (JSON.parse(rawLog) as StudyLogEntry[]) : [];

      const [itemsResult, logResult] = await Promise.all([
        itemRows.length
          ? bulkImportHubItems(itemRows.map(rowToHubItem))
          : Promise.resolve({ success: true as const, data: { imported: 0 } }),
        logEntries.length
          ? bulkImportStudyLog(logEntries)
          : Promise.resolve({ success: true as const, data: { imported: 0 } }),
      ]);
      if (cancelled) return;

      if (itemsResult.success && logResult.success) {
        try {
          [
            GUEST_ITEMS_KEY,
            GUEST_STUDY_LOG_KEY,
            GUEST_SUBJECTS_KEY,
            GUEST_CUSTOM_SUBJECTS_KEY,
            GUEST_ONBOARDED_KEY,
          ].forEach((k) => localStorage.removeItem(k));
          localStorage.setItem(migratedKey, "1");
        } catch {
          // ignore
        }

        const weekStart = toDateInputValue(studyWeekDates[0]);
        const weekEnd = toDateInputValue(studyWeekDates[6]);
        const [freshItems, freshLog] = await Promise.all([
          getHubItems(),
          getHubStudyLog(weekStart, weekEnd),
        ]);
        if (cancelled) return;
        if (freshItems.success) dispatch({ type: "SET_ALL", items: freshItems.data });
        if (freshLog.success) setStudyLogEntries(freshLog.data);
      }
      // on failure: leave localStorage intact, retry silently on next mount — no blocking UI
    })().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [mounted, userId, studyWeekDates]);

  function logStudySession(hours: number) {
    const logDate = toDateInputValue(new Date());
    setStudyLogEntries((prev) => {
      const idx = prev.findIndex((e) => e.log_date === logDate);
      if (idx === -1) return [...prev, { log_date: logDate, hours: Math.round(hours * 100) / 100 }];
      const next = [...prev];
      next[idx] = { log_date: logDate, hours: Math.round((next[idx].hours + hours) * 100) / 100 };
      return next;
    });
    if (userId) logStudySessionAction(logDate, hours).catch(console.error);
  }

  // Ticks the timer to "complete" once its remaining time reaches zero.
  // Recomputed from Date.now() - startedAt every second rather than
  // decrementing a counter, so a throttled/backgrounded tab can't drift.
  useEffect(() => {
    if (timer.status !== "running") return;
    const id = setInterval(() => {
      setTimer((t) => {
        if (t.status !== "running" || t.startedAt === null) return t;
        const remaining = t.anchorRemainingMs - (Date.now() - t.startedAt);
        if (remaining <= 0) {
          return { ...t, status: "complete", anchorRemainingMs: 0, startedAt: null };
        }
        return t;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timer.status]);

  // Bumps the linked task's session count exactly once per natural
  // completion (the transition INTO "complete", not every render while it
  // stays complete) — a manual reset/end never reaches this since it goes
  // straight back to "idle".
  useEffect(() => {
    if (timer.status === "complete" && prevTimerStatusRef.current !== "complete" && timer.taskId) {
      const taskId = timer.taskId;
      setCompletedSessionsByTask((prev) => ({ ...prev, [taskId]: (prev[taskId] ?? 0) + 1 }));
    }
    prevTimerStatusRef.current = timer.status;
  }, [timer.status, timer.taskId]);

  function selectItem(id: string) {
    setSelectedItemId(id);
    // Decided at interaction time (never during render) so there's no
    // hydration risk: desktop opens the floating 2-column panel, mobile
    // opens a bottom sheet instead.
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    setPanelVariant(isMobile ? "sheet" : "panel");
  }

  function closePanel() {
    setSelectedItemId(null);
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  function goPrev() {
    setCurrentDate((d) => {
      const next = new Date(d);
      if (view === "week") next.setDate(next.getDate() - 7);
      else next.setMonth(next.getMonth() - 1);
      return next;
    });
  }

  function goNext() {
    setCurrentDate((d) => {
      const next = new Date(d);
      if (view === "week") next.setDate(next.getDate() + 7);
      else next.setMonth(next.getMonth() + 1);
      return next;
    });
  }

  function toggleSubject(id: SubjectId) {
    setActiveSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSaveResource(id: string) {
    setSavedResourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Requests real OS-level fullscreen (covers the browser's own tab/address
  // bar too, not just the page) right alongside opening the overlay — this
  // only works when called within the same user gesture as the click that
  // triggered it, which is why it's called here rather than inside
  // FocusMode's own mount effect (that would run a render cycle later,
  // outside the gesture, and browsers can silently refuse it). Best-effort:
  // some browsers/contexts (Safari's stricter activation rules, an embedded
  // iframe without allow="fullscreen") refuse this silently, in which case
  // focus mode still opens as a normal full-viewport overlay.
  function openFocusMode() {
    setIsFocusModeOpen(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function startFocus(taskId: string) {
    setTimer({ status: "running", startedAt: Date.now(), anchorRemainingMs: TIMER_DURATION_MS, taskId });
    openFocusMode();
  }

  function endFocusSession() {
    resetTimer();
    setIsFocusModeOpen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  function closeFocusMode() {
    setIsFocusModeOpen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  function startOrResumeTimer() {
    setTimer((t) => ({ ...t, status: "running", startedAt: Date.now() }));
  }

  function pauseTimer() {
    setTimer((t) => {
      if (t.status !== "running" || t.startedAt === null) return t;
      return {
        ...t,
        status: "paused",
        anchorRemainingMs: t.anchorRemainingMs - (Date.now() - t.startedAt),
        startedAt: null,
      };
    });
  }

  function resetTimer() {
    setTimer((t) => ({ ...INITIAL_TIMER_STATE, taskId: t.taskId }));
  }

  // Shows a visible error and re-syncs from the server whenever a
  // background save fails, instead of leaving the optimistic UI update
  // looking like it succeeded (see the `actionError` state comment above).
  async function persistOrRevert(
    promise: Promise<ActionResult<unknown>>,
    message = "Couldn't save your change — try again.",
  ) {
    const result = await promise;
    if (!result.success) {
      setActionError(message);
      const fresh = await getHubItems();
      if (fresh.success) dispatch({ type: "SET_ALL", items: fresh.data });
    }
  }

  function handleMoveItem(id: string, start: Date, end: Date) {
    dispatch({ type: "MOVE", id, start, end });
    if (userId) persistOrRevert(updateHubItemTimeAction(id, start, end));
  }

  function handleResizeItem(id: string, end: Date) {
    dispatch({ type: "RESIZE", id, end });
    if (!userId) return;
    const item = items.find((i) => i.id === id);
    if (item) persistOrRevert(updateHubItemTimeAction(id, item.start, end));
  }

  function handleUpdateTime(itemId: string, start: Date, end: Date) {
    dispatch({ type: "UPDATE_TIME", id: itemId, start, end });
    if (userId) persistOrRevert(updateHubItemTimeAction(itemId, start, end));
  }

  function handleToggleStage(itemId: string, stageIndex: number) {
    dispatch({ type: "UPDATE_STAGE", id: itemId, stageIndex });
    if (!userId) return;
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const newStages = item.stages.map((s, idx) => (idx === stageIndex ? { ...s, done: !s.done } : s));
    persistOrRevert(updateHubItemStagesAction(itemId, newStages));
  }

  function handleToggleStatus(itemId: string) {
    dispatch({ type: "TOGGLE_STATUS", id: itemId });
    if (!userId) return;
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const newStatus: HubItemStatus = item.status === "done" ? "todo" : "done";
    persistOrRevert(updateHubItemStatusAction(itemId, newStatus));
  }

  function handleUpdateNotes(itemId: string, notes: string) {
    dispatch({ type: "UPDATE_NOTES", id: itemId, notes });
    if (!userId) return;
    if (notesTimers.current[itemId]) clearTimeout(notesTimers.current[itemId]);
    notesTimers.current[itemId] = setTimeout(() => {
      persistOrRevert(updateHubItemNotesAction(itemId, notes));
    }, 600);
  }

  function handleAddItem(item: HubItem) {
    dispatch({ type: "ADD", item });
    if (userId) persistOrRevert(createHubItemAction(item), "Couldn't save this item — try again.");
  }

  function openEditDialog(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (item) setEditingItem(item);
  }

  function handleEditItem(
    id: string,
    details: { title: string; type: HubItemType; subjectId: SubjectId | null; start: Date; end: Date },
  ) {
    dispatch({ type: "UPDATE_DETAILS", id, details });
    if (userId) {
      persistOrRevert(updateHubItemDetailsAction(id, details), "Couldn't save your edits — try again.");
    }
  }

  function handleDeleteItem(itemId: string) {
    dispatch({ type: "DELETE", id: itemId });
    if (selectedItemId === itemId) setSelectedItemId(null);
    if (userId) {
      persistOrRevert(deleteHubItemAction(itemId), "Couldn't delete this item — try again.");
    }
  }

  function completeOnboarding(subjectIds: SubjectId[] | null, newCustomSubjects: CustomSubject[]) {
    setShowOnboarding(false);
    applyNewSubjects(subjectIds);
    setCustomSubjects(newCustomSubjects);
    if (userId) {
      persistOrRevert(completeHubOnboardingAction(subjectIds, newCustomSubjects));
    } else {
      try {
        localStorage.setItem(GUEST_ONBOARDED_KEY, "1");
        if (subjectIds) localStorage.setItem(GUEST_SUBJECTS_KEY, JSON.stringify(subjectIds));
        else localStorage.removeItem(GUEST_SUBJECTS_KEY);
        if (newCustomSubjects.length > 0) {
          localStorage.setItem(GUEST_CUSTOM_SUBJECTS_KEY, JSON.stringify(newCustomSubjects));
        } else {
          localStorage.removeItem(GUEST_CUSTOM_SUBJECTS_KEY);
        }
      } catch {
        // ignore
      }
      setShowGuestSaveBanner(true);
    }
  }

  function handleChangeSession(value: string) {
    setSessionOverride(value);
    try {
      localStorage.setItem(SESSION_OVERRIDE_KEY_PREFIX + (userId ?? "guest"), value);
    } catch {
      // ignore — the picker still works for the rest of this visit
    }
  }

  function handleSaveSubjects(subjectIds: SubjectId[] | null, newCustomSubjects: CustomSubject[]) {
    applyNewSubjects(subjectIds);
    setCustomSubjects(newCustomSubjects);
    if (userId) {
      persistOrRevert(completeHubOnboardingAction(subjectIds, newCustomSubjects));
    } else {
      try {
        if (subjectIds) localStorage.setItem(GUEST_SUBJECTS_KEY, JSON.stringify(subjectIds));
        else localStorage.removeItem(GUEST_SUBJECTS_KEY);
        if (newCustomSubjects.length > 0) {
          localStorage.setItem(GUEST_CUSTOM_SUBJECTS_KEY, JSON.stringify(newCustomSubjects));
        } else {
          localStorage.removeItem(GUEST_CUSTOM_SUBJECTS_KEY);
        }
      } catch {
        // ignore
      }
    }
  }

  // Imported items land straight in Supabase via their own server action
  // (confirmIcsImport), bypassing the reducer entirely — re-fetching is the
  // simplest way to bring them into view, same as the guest→account
  // migration effect above.
  async function handleImported(info: { batchId: string; count: number }) {
    setIsImportDialogOpen(false);
    if (userId) {
      const fresh = await getHubItems();
      if (fresh.success) dispatch({ type: "SET_ALL", items: fresh.data });
    }
    setImportToast(info);
  }

  async function handleUndoImportToast() {
    if (!importToast) return;
    setUndoingImport(true);
    const result = await undoImportBatch(importToast.batchId);
    setUndoingImport(false);
    if (result.success) {
      const fresh = await getHubItems();
      if (fresh.success) dispatch({ type: "SET_ALL", items: fresh.data });
    } else {
      setActionError("Couldn't undo that import — try again.");
    }
    setImportToast(null);
  }

  // Auto-dismisses the post-import toast — undoing after that point is
  // still possible via the Import dialog's own "Recent imports" list.
  useEffect(() => {
    if (!importToast) return;
    const timer = setTimeout(() => setImportToast(null), 8000);
    return () => clearTimeout(timer);
  }, [importToast]);

  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => setActionError(null), 6000);
    return () => clearTimeout(timer);
  }, [actionError]);

  const allDayItemsThisWeek = items.filter(
    (i) => i.allDay && weekDates.some((d) => isSameDay(d, i.start)),
  );
  const deadlineCount = items.filter(
    (i) =>
      i.status !== "done" &&
      weekDates.some((d) => isSameDay(d, i.end) || isSameDay(d, i.start)),
  ).length;

  const session = sessionOverride ?? defaultHubSession(!userId, ibYear);

  const focusTask = timer.taskId ? (items.find((i) => i.id === timer.taskId) ?? null) : null;
  const timerTaskTitle = focusTask?.title ?? null;
  const completedSessionsForTask = timer.taskId ? (completedSessionsByTask[timer.taskId] ?? 0) : 0;
  const focusSessionNumber = (completedSessionsForTask % SESSIONS_PER_CYCLE) + 1;
  const focusResources = focusTask?.subjectId ? (resourcesBySubject[focusTask.subjectId] ?? []) : [];

  const panelActions: PanelActions = {
    resources: selectedItem?.subjectId ? (resourcesBySubject[selectedItem.subjectId] ?? []) : [],
    savedResourceIds,
    onToggleSaveResource: toggleSaveResource,
    onToggleStage: handleToggleStage,
    onToggleStatus: handleToggleStatus,
    onUpdateNotes: handleUpdateNotes,
    onUpdateTime: handleUpdateTime,
    onStartFocus: startFocus,
    onEdit: openEditDialog,
    onDelete: handleDeleteItem,
    customSubjects,
  };

  if (!mounted) {
    return <div className="max-w-[1600px] mx-auto w-full px-md md:px-lg xl:px-20 py-lg" aria-hidden="true" />;
  }

  return (
    <div className="flex flex-col gap-lg px-md md:px-lg xl:px-20 py-lg max-w-[1600px] mx-auto w-full">
      <HubHeader
        firstName={firstName}
        isGuest={!userId}
        deadlineCount={deadlineCount}
        view={view}
        onChangeView={setView}
        currentDate={currentDate}
        weekDates={weekDates}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onAddItem={() => setIsAddDialogOpen(true)}
        onSyncCalendar={() => setIsSyncDialogOpen(true)}
        session={session}
        onChangeSession={handleChangeSession}
        onImport={() => setIsImportDialogOpen(true)}
      />

      <TodayFocus
        items={items}
        onSelect={selectItem}
        onToggleStatus={handleToggleStatus}
        onStartFocus={startFocus}
        onAddItem={() => setIsAddDialogOpen(true)}
      />

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-lg items-stretch">
        <div className="lg:col-span-9">
          <MilestonesBar
            subjects={mySubjects}
            activeSubjectIds={activeSubjectIds}
            onToggleSubject={toggleSubject}
            onEditSubjects={() => setIsEditSubjectsOpen(true)}
            allDayItems={allDayItemsThisWeek}
            selectedItemId={selectedItemId}
            onSelect={selectItem}
          />
        </div>
        <div className="lg:col-span-3">
          <FocusTimerCard
            timerState={timer}
            taskTitle={timerTaskTitle}
            onStartOrResume={startOrResumeTimer}
            onPause={pauseTimer}
            onReset={resetTimer}
            onEnterFocusMode={openFocusMode}
          />
        </div>
      </div>

      {view === "month" ? (
        <MonthView
          anchorDate={currentDate}
          items={items}
          onSelectDay={(date) => {
            setCurrentDate(date);
            setView("week");
          }}
          customSubjects={customSubjects}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <WeekCalendar
              weekDates={weekDates}
              items={items}
              activeSubjectIds={activeSubjectIds}
              selectedItem={selectedItem}
              showPanel={panelVariant === "panel"}
              panelActions={panelActions}
              onSelect={selectItem}
              onClose={closePanel}
              onMoveItem={handleMoveItem}
              onResizeItem={handleResizeItem}
            />
          </div>
          <div className="md:hidden">
            <DayAgenda
              weekDates={weekDates}
              items={items}
              activeSubjectIds={activeSubjectIds}
              selectedItemId={selectedItemId}
              onSelect={selectItem}
              onClose={closePanel}
            />
          </div>
        </>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <UpcomingDeadlinesCard items={items} onSelect={selectItem} />
        <StudyTimeCard studyLog={studyLog} weekDates={studyWeekDates} onLogSession={logStudySession} />
      </section>

      {selectedItem && panelVariant === "sheet" && (
        <TaskDetailsPanel variant="sheet" item={selectedItem} onClose={closePanel} {...panelActions} />
      )}

      {isFocusModeOpen && (
        <FocusMode
          timerState={timer}
          task={focusTask}
          sessionNumber={focusSessionNumber}
          totalSessions={SESSIONS_PER_CYCLE}
          resources={focusResources}
          savedResourceIds={savedResourceIds}
          onToggleSaveResource={toggleSaveResource}
          onPause={pauseTimer}
          onResume={startOrResumeTimer}
          onEnd={endFocusSession}
          onMinimize={closeFocusMode}
          customSubjects={customSubjects}
        />
      )}

      {(isAddDialogOpen || editingItem) && (
        <AddItemDialog
          defaultDate={currentDate}
          subjects={mySubjects}
          item={editingItem}
          onClose={() => {
            setIsAddDialogOpen(false);
            setEditingItem(null);
          }}
          onAdd={handleAddItem}
          onSave={handleEditItem}
        />
      )}

      {isSyncDialogOpen && (
        <CalendarSyncDialog isGuest={!userId} onClose={() => setIsSyncDialogOpen(false)} />
      )}

      {isImportDialogOpen && (
        <ImportDialog
          isGuest={!userId}
          subjects={mySubjects}
          onClose={() => setIsImportDialogOpen(false)}
          onImported={handleImported}
        />
      )}

      {importToast && (
        // w-[calc(100%-2rem)]+max-w-md on mobile so the sentence gets real
        // room to wrap onto at most a couple of lines instead of forcing a
        // narrow shrink-to-fit pill that wrapped every couple of words;
        // sm:w-auto brings back the original compact single-line pill once
        // there's enough width for it to actually fit on one line.
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 w-[calc(100%-2rem)] max-w-[28rem] sm:w-auto flex flex-wrap items-center justify-center gap-sm sm:gap-md bg-surface-container-lowest border border-outline-variant rounded-2xl sm:rounded-full shadow-lg px-lg py-sm">
          <span className="text-label-md text-on-surface text-center">
            Imported {importToast.count} item{importToast.count === 1 ? "" : "s"}.
          </span>
          <button
            type="button"
            onClick={handleUndoImportToast}
            disabled={undoingImport}
            className="text-label-md font-bold text-primary hover:underline shrink-0 disabled:opacity-60 cursor-pointer"
          >
            {undoingImport ? "Undoing…" : "Undo"}
          </button>
          <button
            type="button"
            onClick={() => setImportToast(null)}
            aria-label="Dismiss"
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 w-[calc(100%-2rem)] max-w-[28rem] sm:w-auto flex flex-wrap items-center justify-center gap-sm bg-error-container border border-error/30 rounded-2xl sm:rounded-full shadow-lg px-lg py-sm">
          <span className="text-label-md text-on-error-container text-center">{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="Dismiss"
            className="p-1 text-on-error-container hover:opacity-70 transition-opacity cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showOnboarding && (
        <OnboardingWizard
          onFinish={(subjectIds, newCustomSubjects) => completeOnboarding(subjectIds, newCustomSubjects)}
          onSkip={() => completeOnboarding(null, [])}
        />
      )}

      {isEditSubjectsOpen && (
        <EditSubjectsDialog
          initialSelected={mySubjectIds}
          initialCustomSubjects={customSubjects}
          onSave={handleSaveSubjects}
          onClose={() => setIsEditSubjectsOpen(false)}
        />
      )}

      {showGuestSaveBanner && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 w-[calc(100%-2rem)] max-w-[28rem] sm:w-auto flex flex-wrap items-center justify-center gap-sm sm:gap-md bg-surface-container-lowest border border-outline-variant rounded-2xl sm:rounded-full shadow-lg px-lg py-sm">
          <span className="text-label-md text-on-surface text-center">
            Planning as a guest — sign in to save your progress.
          </span>
          <Link
            href="/login?next=/hub"
            className="text-label-md font-bold text-primary hover:underline shrink-0"
          >
            Sign in
          </Link>
          <button
            type="button"
            onClick={() => setShowGuestSaveBanner(false)}
            aria-label="Dismiss"
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
