"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StrengthMap } from "@/lib/data/types";
import { links } from "@/lib/practice/links";
import { StrengthLegend } from "./StrengthLegend";
import { StrengthMapView } from "./StrengthMapView";
import { FirstTimeHint } from "../FirstTimeHint";

/** One subject at a time (Home, Practice), stepped with the arrows or the subject pills. */
export function StrengthCarousel({
  maps: allMaps,
  title = "Your strength maps",
  hintPending = false,
}: {
  maps: StrengthMap[];
  title?: string;
  hintPending?: boolean;
}) {
  const [index, setIndex] = useState(0);
  // Subjects with no syllabus (e.g. one the student typed themselves) have no map.
  const maps = allMaps.filter((m) => m.topics.length > 0);
  const map = maps[index];
  if (!map) return null;
  const step = (dir: 1 | -1) => setIndex((i) => (i + dir + maps.length) % maps.length);

  return (
    <section className="flex flex-col gap-md" aria-label={title} aria-roledescription="carousel">
      <div className="flex items-end justify-between gap-md flex-wrap">
        <div className="flex flex-col gap-xs">
          <h2 className="font-serif font-bold text-headline-md text-on-surface">{title}</h2>
          <FirstTimeHint
            id="strength-map"
            pending={hintPending}
            placement="bottom-start"
            text="Each tile is a topic, shaded by how strong you are: darker is stronger (brighter in dark themes). Answer 5 questions in a topic to see its level, and click a tile to practise it."
          >
            <StrengthLegend />
          </FirstTimeHint>
        </div>
        {maps.length > 1 && (
          <div className="flex items-center gap-xs">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous subject"
              className="p-sm rounded-[50%] border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-primary cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-label-md text-on-surface-variant tabular-nums w-10 text-center" aria-live="polite">
              {index + 1} / {maps.length}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next subject"
              className="p-sm rounded-[50%] border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:text-primary cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {maps.length > 1 && (
        <div className="flex flex-wrap gap-xs" role="tablist" aria-label="Subjects">
          {maps.map((m, i) => (
            <button
              key={m.subject.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              className={`rounded-full px-md py-xs text-label-md font-semibold cursor-pointer transition-colors ${
                i === index ? "bg-primary text-on-primary" : "bg-surface-container-lowest text-on-surface-variant hover:text-primary"
              }`}
            >
              {m.subject.shortName}
            </button>
          ))}
        </div>
      )}

      <article
        key={map.subject.id}
        role="tabpanel"
        aria-label={`${map.subject.shortName} ${map.level}`}
        className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl flex flex-col gap-lg"
      >
        <header className="flex items-center gap-sm">
          <Link href={links.subject(map.subject.id)} className="font-serif font-bold text-headline-md text-on-surface hover:text-primary">
            {map.subject.name}
          </Link>
          <span className="rounded-full bg-primary text-on-primary px-sm py-px text-label-sm font-bold">{map.level}</span>
        </header>
        <StrengthMapView map={map} />
      </article>
    </section>
  );
}
