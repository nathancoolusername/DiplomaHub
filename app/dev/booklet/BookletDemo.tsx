"use client";

import { useState } from "react";
import type { Booklet } from "@/lib/booklets";
import type { Level } from "@/lib/data/types";
import { BookletPanel } from "@/components/practice/player/BookletPanel";

/** The booklet beside a stand-in question, laid out like the player. */
export function BookletDemo({ booklet, level, topic, topicNames }: { booklet: Booklet; level: Level; topic: string; topicNames: Record<string, string> }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={open ? "pb-[calc(60vh+7rem)] lg:pb-28" : "pb-28"}>
      <div className={`${open ? "max-w-[1200px] xl:max-w-[1440px] 2xl:max-w-[1680px]" : "max-w-[1200px]"} mx-auto px-md pt-lg flex gap-lg`}>
        <article className="flex-1 min-w-0 rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl flex flex-col gap-md">
          <p className="text-label-sm text-on-surface-variant">Paper 1 · Topic {topic} · {level}</p>
          <p className="text-body-lg text-on-surface">A stand-in question. The booklet opens at this question&apos;s topic.</p>
          <button type="button" onClick={() => setOpen(!open)} className="self-start rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold cursor-pointer">
            {open ? "Close booklet" : "Open booklet"}
          </button>
        </article>
        {open && <BookletPanel booklet={booklet} level={level} topic={topic} topicNames={topicNames} onClose={() => setOpen(false)} />}
      </div>
    </div>
  );
}
