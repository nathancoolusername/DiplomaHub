"use client";

import Panel from "./article-panel";
import type { Resource } from "@/app/lib/types";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  data: Resource[];
  title?: string;
  subtitle?: string;
  // Used when this grid sits beside another section (e.g. the signed-in
  // dashboard's Hub summary) instead of taking the full page width — drops
  // the fixed full-page height and the 3-column breakpoint, which would
  // otherwise cram cards into a half-width column.
  compact?: boolean;
  // Renders on the pale-blue "washed out" background instead of plain
  // white — used on the signed-out homepage to keep its alternating
  // primary/washed section bands going.
  washed?: boolean;
};

export default function ResourceHome({
  data,
  title = "Featured Resources",
  subtitle = "Handpicked expertise from the IB community's top contributors.",
  compact = false,
  washed = false,
}: Props) {
  const perPage = compact ? 4 : 3;
  const [num, setNum] = useState(1);
  const currentItems = data.slice((+num - 1) * perPage, +num * perPage);
  return (
    <div
      className={`${washed ? "bg-surface-container-low" : "bg-surface-container-lowest"} min-h-fit flex flex-col px-lg py-lg place-content-center gap-15 ${compact ? "" : "md:h-[730px] md:py-0"}`}
    >
      <div className="mb-lg flex flex-col sm:flex-row justify-between gap-md">
        <div>
          <h2 className="text-headline-lg font-serif font-bold">
            {title}
          </h2>
          <p className="text-on-surface-variant text-body-lg">
            {subtitle}
          </p>
        </div>
        <div className="flex flex-row gap-sm">
          <button
            onClick={() => {
              if (num == 1) {
                return;
              } else {
                setNum(num - 1);
              }
            }}
          >
            <div className="p-sm rounded-xl border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer">
              <ChevronLeft />
            </div>
          </button>
          <button
            onClick={() => {
              if (num * perPage < data.length) {
                setNum(num + 1);
              }
            }}
          >
            <div className="p-sm rounded-xl border-outline-variant border-1 h-10 hover:bg-surface-container-high transition cursor-pointer">
              <ChevronRight />
            </div>
          </button>
        </div>
      </div>
      <div
        className={`grid grid-cols-1 gap-gutter w-full ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}
      >
        {currentItems.map((row) => (
          <div key={row.id}>
            <Panel resource={row} />
          </div>
        ))}
      </div>
    </div>
  );
}
