"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// Same numbered-pagination shape already used by the public resource/
// article/discussion grids (resources-grid.tsx etc.) — extracted here since
// the admin tables need the identical control a third+ time.
export function Pagination({
  page,
  totalCount,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const numButtons = Math.ceil(totalCount / pageSize);
  if (numButtons <= 1) return null;

  const buttons: React.ReactNode[] = [];
  for (let i = 1; i <= numButtons; i++) {
    const isActive = page === i;
    const showPage = i <= 3 || i === numButtons || Math.abs(i - page) <= 1;

    if (showPage) {
      buttons.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`border-1 border-outline-variant h-10 w-9 items-center rounded cursor-pointer ${isActive ? "bg-primary text-on-primary" : "hover:bg-surface-container-high transition"}`}
        >
          {i}
        </button>,
      );
    } else if (
      (i === 4 && page > 4) ||
      (i === numButtons - 1 && Math.abs(i - page) > 1)
    ) {
      buttons.push(<span key={`ellipsis-${i}`}>...</span>);
    }
  }

  return (
    <div className="flex flex-row gap-sm items-center justify-content-center place-content-center">
      <button
        onClick={() => {
          if (page !== 1) onPageChange(page - 1);
        }}
      >
        <div className="p-sm rounded border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer">
          <ChevronLeft />
        </div>
      </button>
      {buttons}
      <button
        onClick={() => {
          if (page < numButtons) onPageChange(page + 1);
        }}
      >
        <div className="p-sm rounded border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer">
          <ChevronRight />
        </div>
      </button>
    </div>
  );
}
