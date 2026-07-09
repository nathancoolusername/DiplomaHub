"use client";

import { useState, type ReactNode } from "react";

export function LoadMoreList<T>({
  items,
  pageSize = 6,
  renderItem,
  emptyMessage,
  listClassName,
}: {
  items: T[];
  pageSize?: number;
  renderItem: (item: T) => ReactNode;
  emptyMessage: string;
  listClassName: string;
}) {
  const [shown, setShown] = useState(pageSize);

  if (items.length === 0) {
    return (
      <p className="text-on-surface-variant text-body-md">{emptyMessage}</p>
    );
  }

  const visible = items.slice(0, shown);

  return (
    <div className="flex flex-col gap-margin">
      <div className={listClassName}>{visible.map(renderItem)}</div>
      {shown < items.length && (
        <button
          onClick={() => setShown(shown + pageSize)}
          className="text-primary font-bold border-1 border-outline-variant h-15 w-68 rounded-xl self-center hover:bg-surface-container-low cursor-pointer"
        >
          Load more
        </button>
      )}
    </div>
  );
}
