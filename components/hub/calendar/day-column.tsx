"use client";

import type { HubItem, SubjectId } from "../mock-data";
import { CALENDAR_BODY_HEIGHT, isSameDay, layoutOverlappingItems } from "./calendar-utils";
import TaskBlock, { type DragPreview } from "./task-block";
import CurrentTimeLine from "./current-time-line";

export default function DayColumn({
  date,
  dayIndex,
  items,
  isToday,
  selectedItemId,
  dragPreview,
  dragOffsetPx,
  resizePreview,
  columnElsRef,
  onSelect,
  onClose,
  onDragPreview,
  onDragCommit,
  onResizePreview,
  onResizeCommit,
}: {
  date: Date;
  dayIndex: number;
  items: HubItem[];
  isToday: boolean;
  selectedItemId: string | null;
  dragPreview: (DragPreview & { id: string }) | null;
  dragOffsetPx: number;
  resizePreview: { id: string; end: Date } | null;
  columnElsRef: React.RefObject<(HTMLDivElement | null)[]>;
  onSelect: (id: string) => void;
  onClose: () => void;
  onDragPreview: (id: string, preview: DragPreview) => void;
  onDragCommit: (id: string) => void;
  onResizePreview: (id: string, end: Date) => void;
  onResizeCommit: (id: string) => void;
}) {
  // `items` is always the real, committed set for this day — a dragged item
  // stays put in its original column for the whole gesture (see
  // task-block.tsx) and is only visually offset toward the target day via
  // `dragOffsetPx`, so membership here never depends on the in-flight
  // preview. Apply the time-of-day portion of an active preview so the
  // block's vertical position (and any overlap layout) tracks live.
  const displayItems = items.map((item) => {
    if (resizePreview && resizePreview.id === item.id) {
      return { ...item, end: resizePreview.end };
    }
    if (dragPreview && dragPreview.id === item.id) {
      return { ...item, start: dragPreview.start, end: dragPreview.end };
    }
    return item;
  });

  const layouted = layoutOverlappingItems(displayItems);

  return (
    <div
      className={`relative border-l border-outline-variant/50 ${isToday ? "bg-secondary-container/10" : ""}`}
      style={{ height: CALENDAR_BODY_HEIGHT }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      ref={(el) => {
        if (columnElsRef.current) columnElsRef.current[dayIndex] = el;
      }}
      data-day-index={dayIndex}
      data-day-iso={date.toISOString()}
    >
      {isToday && <CurrentTimeLine />}
      {layouted.map(({ item, column, columns }) => (
        <TaskBlock
          key={item.id}
          item={item}
          dayIndex={dayIndex}
          isSelected={selectedItemId === item.id}
          isDragging={dragPreview?.id === item.id || resizePreview?.id === item.id}
          left={`${(column / columns) * 100}%`}
          width={`${100 / columns}%`}
          dragOffsetPx={dragPreview?.id === item.id ? dragOffsetPx : 0}
          columnElsRef={columnElsRef}
          onSelect={onSelect}
          onDragPreview={onDragPreview}
          onDragCommit={onDragCommit}
          onResizePreview={onResizePreview}
          onResizeCommit={onResizeCommit}
        />
      ))}
    </div>
  );
}

export function isItemOnDay(item: { start: Date; subjectId: SubjectId | null }, date: Date) {
  return isSameDay(item.start, date);
}
