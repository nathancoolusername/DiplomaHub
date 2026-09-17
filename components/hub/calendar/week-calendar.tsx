"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Resource } from "@/app/lib/types";
import type { HubItem, SubjectId } from "../mock-data";
import TaskDetailsPanel from "../task-details-panel";
import DayColumn from "./day-column";
import type { DragPreview } from "./task-block";
import { CALENDAR_BODY_HEIGHT, END_HOUR, GRID_COLS, PX_PER_HOUR, START_HOUR, isSameDay } from "./calendar-utils";

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export type PanelActions = {
  resources: Resource[];
  savedResourceIds: Set<string>;
  onToggleSaveResource: (id: string) => void;
  onToggleStage: (itemId: string, stageIndex: number) => void;
  onToggleStatus: (itemId: string) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  onUpdateTime: (itemId: string, start: Date, end: Date) => void;
  onStartFocus: (itemId: string) => void;
  onEdit: (itemId: string) => void;
  onDelete: (itemId: string) => void;
};

export default function WeekCalendar({
  weekDates,
  items,
  activeSubjectIds,
  selectedItem,
  showPanel,
  panelActions,
  onSelect,
  onClose,
  onMoveItem,
  onResizeItem,
}: {
  weekDates: Date[];
  items: HubItem[];
  activeSubjectIds: Set<SubjectId>;
  selectedItem: HubItem | null;
  showPanel: boolean;
  panelActions: PanelActions;
  onSelect: (id: string) => void;
  onClose: () => void;
  onMoveItem: (id: string, start: Date, end: Date) => void;
  onResizeItem: (id: string, end: Date) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const columnElsRef = useRef<(HTMLDivElement | null)[]>(new Array(7).fill(null));

  const [dragPreview, setDragPreview] = useState<
    (DragPreview & { id: string; offsetPx: number }) | null
  >(null);
  const [resizePreview, setResizePreview] = useState<{ id: string; end: Date } | null>(null);
  const [panelRect, setPanelRect] = useState<{ left: number; width: number } | null>(null);

  const today = new Date();

  const visibleItems = useMemo(
    () =>
      items.filter(
        (item) => !item.allDay && (item.subjectId === null || activeSubjectIds.has(item.subjectId)),
      ),
    [items, activeSubjectIds],
  );

  // Always the item's real, committed day — see task-block.tsx for why a
  // dragged item is never rerouted to a different day's list mid-gesture.
  function itemsForDay(dayIndex: number): HubItem[] {
    return visibleItems.filter((item) => isSameDay(item.start, weekDates[dayIndex]));
  }

  function handleDragPreview(id: string, preview: DragPreview) {
    // Reading columnElsRef here (inside an event-handler-triggered callback)
    // rather than during render — React's rules disallow reading a ref's
    // .current while rendering. This pixel distance between the item's
    // original column and its preview's target column becomes the
    // translateX applied to the (still-original-parented) task block so it
    // visually tracks the drag without moving in the tree until it commits.
    const offsetPx =
      preview.dayIndex !== preview.originalDayIndex
        ? (columnElsRef.current[preview.dayIndex]?.offsetLeft ?? 0) -
          (columnElsRef.current[preview.originalDayIndex]?.offsetLeft ?? 0)
        : 0;
    setDragPreview({ id, ...preview, offsetPx });
  }

  function handleDragCommit(id: string) {
    // Read dragPreview from this render's own closure and dispatch directly
    // — dispatching hub.tsx's reducer from inside *this* component's own
    // setState updater (the previous approach) meant an already-open details
    // panel wouldn't reliably see the moved item's new time until it was
    // closed and reopened.
    if (dragPreview && dragPreview.id === id) {
      const original = items.find((i) => i.id === id);
      if (
        original &&
        (original.start.getTime() !== dragPreview.start.getTime() ||
          original.end.getTime() !== dragPreview.end.getTime())
      ) {
        onMoveItem(id, dragPreview.start, dragPreview.end);
      }
    }
    setDragPreview(null);
  }

  function handleResizePreview(id: string, end: Date) {
    setResizePreview({ id, end });
  }

  function handleResizeCommit(id: string) {
    if (resizePreview && resizePreview.id === id) {
      const original = items.find((i) => i.id === id);
      if (original && original.end.getTime() !== resizePreview.end.getTime()) {
        onResizeItem(id, resizePreview.end);
      }
    }
    setResizePreview(null);
  }

  const selectedDayIndex = selectedItem
    ? weekDates.findIndex((d) => isSameDay(d, selectedItem.start))
    : -1;
  // Panel covers Sat/Sun (indices 5,6) normally; if the selected task is on
  // Sat/Sun, it swaps to cover Mon/Tue (0,1) instead so it never hides the
  // task it's describing.
  const coversWeekend = !(selectedDayIndex === 5 || selectedDayIndex === 6);
  const panelStartIdx = coversWeekend ? 5 : 0;
  const panelEndIdx = coversWeekend ? 6 : 1;
  const panelSide: "left" | "right" = coversWeekend ? "right" : "left";

  // Only ever set panelRect from inside a callback (the ResizeObserver's own
  // callback, or the resize listener) — never synchronously in the effect
  // body. ResizeObserver reports the initial size asynchronously on its own,
  // so this still measures promptly without an inline call. When the panel
  // shouldn't show, the render below derives null instead of resetting state.
  useEffect(() => {
    if (!showPanel || !selectedItem) return;

    function measure() {
      const startEl = columnElsRef.current[panelStartIdx];
      const endEl = columnElsRef.current[panelEndIdx];
      if (!startEl || !endEl) return;
      const left = startEl.offsetLeft;
      const width = endEl.offsetLeft + endEl.offsetWidth - left;
      setPanelRect({ left, width });
    }

    const observer = new ResizeObserver(measure);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [showPanel, selectedItem, panelStartIdx, panelEndIdx]);

  const effectivePanelRect = showPanel && selectedItem ? panelRect : null;

  return (
    <div
      data-tour="calendar"
      className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col"
    >
      <div className="grid bg-surface-container-low border-b border-outline-variant" style={{ gridTemplateColumns: GRID_COLS }}>
        <div className="py-sm px-sm text-[11px] font-semibold text-outline">Time</div>
        {weekDates.map((date, i) => {
          const isToday = isSameDay(date, today);
          return (
            <div key={i} className="flex flex-col items-center py-sm gap-1">
              <span className={`text-[11px] font-semibold ${isToday ? "text-primary" : "text-on-surface-variant"}`}>
                {date.toLocaleDateString(undefined, { weekday: "short" })}
              </span>
              <span
                className={`text-label-md font-bold flex items-center justify-center ${
                  isToday ? "w-6 h-6 rounded-full bg-primary text-on-primary" : "text-on-surface"
                }`}
              >
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div ref={wrapperRef} className="relative">
        <div className="select-none">
          <div className="grid" style={{ gridTemplateColumns: GRID_COLS, height: CALENDAR_BODY_HEIGHT }}>
            <div className="relative border-r border-outline-variant/50">
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  // The very first label sits flush with the grid's top edge
                  // (growing down) instead of centered on the hour line like
                  // every other label — centering it the same way would
                  // translate it upward past y:0, off the top of the
                  // calendar's own overflow-hidden box.
                  className={`absolute left-0 right-0 text-[11px] text-outline pl-1 ${i === 0 ? "" : "-translate-y-1/2"}`}
                  style={{ top: (h - START_HOUR) * PX_PER_HOUR }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>
            {weekDates.map((date, i) => (
              <DayColumn
                key={i}
                date={date}
                dayIndex={i}
                items={itemsForDay(i)}
                isToday={isSameDay(date, today)}
                selectedItemId={selectedItem?.id ?? null}
                dragPreview={dragPreview}
                dragOffsetPx={dragPreview?.offsetPx ?? 0}
                resizePreview={resizePreview}
                columnElsRef={columnElsRef}
                onSelect={onSelect}
                onClose={onClose}
                onDragPreview={handleDragPreview}
                onDragCommit={handleDragCommit}
                onResizePreview={handleResizePreview}
                onResizeCommit={handleResizeCommit}
              />
            ))}
          </div>
        </div>

        {selectedItem && effectivePanelRect && (
          <TaskDetailsPanel
            variant="panel"
            item={selectedItem}
            panelLeft={effectivePanelRect.left}
            panelWidth={effectivePanelRect.width}
            side={panelSide}
            onClose={onClose}
            {...panelActions}
          />
        )}
      </div>

      <div className="px-md py-sm bg-surface-container-low border-t border-outline-variant flex items-center justify-between text-[11px] text-on-surface-variant">
        <span>Click a task to inspect details, or drag to reschedule.</span>
        <span className="font-semibold text-primary">
          Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </span>
      </div>
    </div>
  );
}
