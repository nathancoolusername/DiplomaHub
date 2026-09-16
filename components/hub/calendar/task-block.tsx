"use client";

import { useRef } from "react";
import { Check, AlertCircle } from "lucide-react";
import type { HubItem } from "../mock-data";
import { ITEM_TYPE_META } from "../item-type-meta";
import { getSubjectColor } from "../subject-colors";
import { getDueStatus } from "../format";
import {
  addMinutes,
  clampToVisibleRange,
  durationToHeight,
  END_HOUR,
  formatTime,
  PX_PER_MIN,
  snapTo15,
  timeToY,
} from "./calendar-utils";

export type DragPreview = { start: Date; end: Date; dayIndex: number; originalDayIndex: number };

export default function TaskBlock({
  item,
  dayIndex,
  isSelected,
  isDragging,
  left,
  width,
  dragOffsetPx,
  columnElsRef,
  onSelect,
  onDragPreview,
  onDragCommit,
  onResizePreview,
  onResizeCommit,
}: {
  item: HubItem;
  dayIndex: number;
  isSelected: boolean;
  isDragging: boolean;
  left: string;
  width: string;
  // Horizontal pixel offset applied while this item is being dragged toward
  // a different day (see week-calendar.tsx). The block is deliberately kept
  // mounted in its ORIGINAL day column for the whole gesture and just
  // visually shifted with a transform — reparenting it into the target
  // day's column mid-drag would unmount/remount it (new DOM node, fresh
  // refs), silently dropping the in-progress drag state and leaving the
  // move stuck as a phantom preview that never actually commits.
  dragOffsetPx?: number;
  columnElsRef: React.RefObject<(HTMLDivElement | null)[]>;
  onSelect: (id: string) => void;
  onDragPreview: (id: string, preview: DragPreview) => void;
  onDragCommit: (id: string) => void;
  onResizePreview: (id: string, end: Date) => void;
  onResizeCommit: (id: string) => void;
}) {
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originalStart: Date;
    originalEnd: Date;
    originalDayIndex: number;
    columnRects: (DOMRect | null)[];
    moving: boolean;
  } | null>(null);
  const resizeRef = useRef<{
    pointerId: number;
    startY: number;
    originalEnd: Date;
    moving: boolean;
  } | null>(null);

  const color = getSubjectColor(item.subjectId);
  const { Icon } = ITEM_TYPE_META[item.type];
  const dueStatus = getDueStatus(item, new Date());
  const top = timeToY(item.start);
  const height = durationToHeight(item.start, item.end);
  const done = item.status === "done";

  // How far the pointer must move (px) before a press counts as a drag
  // rather than a click — and, together with the `e.buttons` check below,
  // the guard that keeps a plain hover from ever being mistaken for one.
  const DRAG_THRESHOLD_PX = 4;

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originalStart: item.start,
      originalEnd: item.end,
      originalDayIndex: dayIndex,
      columnRects: (columnElsRef.current ?? []).map((el) => el?.getBoundingClientRect() ?? null),
      moving: false,
    };
    onSelect(item.id);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    // The primary mouse button is no longer held — the real pointerup was
    // missed (e.g. released outside the window) and pointer capture never
    // got here. Treat it as the drag ending instead of continuing to move.
    if (e.pointerType === "mouse" && e.buttons === 0) {
      finishDrag(e);
      return;
    }

    if (!drag.moving) {
      const movedPx = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (movedPx < DRAG_THRESHOLD_PX) return;
      drag.moving = true;
    }

    const deltaMinutes = snapTo15((e.clientY - drag.startY) / PX_PER_MIN);
    let newStart = addMinutes(drag.originalStart, deltaMinutes);
    let newEnd = addMinutes(drag.originalEnd, deltaMinutes);

    // Day change is derived from how many column-widths the pointer has
    // moved horizontally *from where the drag started*, not which column
    // the raw cursor X is nearest to — "nearest column" flips days on pure
    // vertical drags whenever the drag started off-center in its column
    // (e.g. near the right edge), which could silently relocate the task
    // onto the next day and collide with whatever already sits there at
    // that time. Tying it to the start offset means a vertical-only drag
    // (deltaX ~ 0) never changes the day, no matter where in the column the
    // press began. The 1.15x multiplier adds a modest buffer over "exactly
    // half a column" so small hand-wobble on an intended vertical drag
    // doesn't flip the day, without requiring a near-perfectly-horizontal
    // gesture — a real diagonal drag to another day still registers.
    const deltaX = e.clientX - drag.startX;
    const rects = drag.columnRects;
    const originRect = rects[drag.originalDayIndex];
    const columnWidth = originRect?.width || rects.find((r) => r)?.width || 1;
    const dayDelta = Math.round(deltaX / (columnWidth * 1.15));
    const newDayIndex = Math.max(0, Math.min(rects.length - 1, drag.originalDayIndex + dayDelta));
    const appliedDayDelta = newDayIndex - drag.originalDayIndex;

    if (appliedDayDelta !== 0) {
      newStart = new Date(newStart);
      newStart.setDate(newStart.getDate() + appliedDayDelta);
      newEnd = new Date(newEnd);
      newEnd.setDate(newEnd.getDate() + appliedDayDelta);
    }

    const clamped = clampToVisibleRange(newStart, newEnd);
    onDragPreview(item.id, {
      start: clamped.start,
      end: clamped.end,
      dayIndex: newDayIndex,
      originalDayIndex: drag.originalDayIndex,
    });
  }

  function finishDrag(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
    // Only a genuine drag (moved past the threshold) should commit a move —
    // a plain click just selects the task, nothing shifts.
    if (drag.moving) onDragCommit(item.id);
  }

  function handleResizePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = { pointerId: e.pointerId, startY: e.clientY, originalEnd: item.end, moving: false };
  }

  function handleResizePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== e.pointerId) return;

    if (e.pointerType === "mouse" && e.buttons === 0) {
      finishResize(e);
      return;
    }

    if (!resize.moving) {
      if (Math.abs(e.clientY - resize.startY) < DRAG_THRESHOLD_PX) return;
      resize.moving = true;
    }

    const deltaMinutes = snapTo15((e.clientY - resize.startY) / PX_PER_MIN);
    let newEnd = addMinutes(resize.originalEnd, deltaMinutes);
    const minEnd = addMinutes(item.start, 15);
    const maxEnd = new Date(item.start);
    maxEnd.setHours(END_HOUR, 0, 0, 0);

    if (newEnd.getTime() < minEnd.getTime()) newEnd = minEnd;
    if (newEnd.getTime() > maxEnd.getTime()) newEnd = maxEnd;
    onResizePreview(item.id, newEnd);
  }

  function finishResize(e: React.PointerEvent<HTMLDivElement>) {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    resizeRef.current = null;
    if (resize.moving) onResizeCommit(item.id);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(item.id);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${item.title}, ${formatTime(item.start)} to ${formatTime(item.end)}${done ? ", done" : dueStatus === "overdue" ? ", overdue" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onLostPointerCapture={finishDrag}
      onKeyDown={handleKeyDown}
      style={{
        position: "absolute",
        top,
        height,
        left,
        width,
        borderLeftColor: color.base,
        touchAction: "none",
        transform: dragOffsetPx ? `translateX(${dragOffsetPx}px)` : undefined,
      }}
      className={`select-none px-1.5 py-1 rounded-md border-l-[3px] bg-surface-container-lowest shadow-xs cursor-grab active:cursor-grabbing overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
        isSelected ? "ring-2 ring-primary z-20 shadow-md" : "hover:shadow-md z-[1]"
      } ${isDragging ? "opacity-80 z-30" : ""} ${done ? "opacity-60" : ""}`}
    >
      <div className="flex flex-col h-full min-w-0">
        <div className="flex items-start gap-1 min-w-0">
          {done ? (
            <Check size={11} className="shrink-0 mt-[1px] text-on-surface-variant" />
          ) : (
            <Icon size={11} className="shrink-0 mt-[1px]" style={{ color: color.base }} />
          )}
          <span
            className={`text-[11px] font-bold leading-tight line-clamp-2 ${done ? "line-through text-on-surface-variant" : "text-on-surface"}`}
          >
            {item.title}
          </span>
        </div>
        {height > 34 && (
          <span className="text-[11px] text-on-surface-variant mt-auto flex items-center gap-1 pt-0.5">
            {formatTime(item.start)}–{formatTime(item.end)}
            {dueStatus === "overdue" && (
              <span className="flex items-center gap-0.5 text-error font-bold">
                <AlertCircle size={10} /> overdue
              </span>
            )}
          </span>
        )}
      </div>
      <div
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={finishResize}
        onPointerCancel={finishResize}
        onLostPointerCapture={finishResize}
        className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize"
        style={{ touchAction: "none" }}
        aria-hidden="true"
      />
    </div>
  );
}
