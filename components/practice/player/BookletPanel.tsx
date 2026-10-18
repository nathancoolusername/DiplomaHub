"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { ArrowUpRight, LayoutGrid, Search, X } from "lucide-react";
import { searchBooklet, searchElements, type Booklet } from "@/lib/booklets";
import { PeriodicTable } from "./PeriodicTable";
import type { Level } from "@/lib/data/types";

/** One formula. Booklet content is our own static data, so its KaTeX HTML is safe to inject. */
const Tex = memo(function Tex({ math, className = "" }: { math: string; className?: string }) {
  const html = useMemo(() => katex.renderToString(String.raw`\displaystyle ${math}`, { throwOnError: false }), [math]);
  // One line: KaTeX would otherwise break long formulas mid-way; the rare one wider than the panel scrolls.
  return <span className={`block overflow-x-auto overflow-y-hidden py-0.5 [&_.katex-html]:whitespace-nowrap ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
});

/**
 * The subject's formula booklet beside the question: a side panel on large
 * screens, a sheet above the bottom bar on smaller ones. Opens at the current
 * question's topic; search looks through names and keywords.
 */
export function BookletPanel({
  booklet,
  level,
  topic,
  topicNames,
  onClose,
}: {
  booklet: Booklet;
  level: Level;
  /** The current question's syllabus topic ("5"). */
  topic: string;
  topicNames: Record<string, string>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [jumpTo, setJumpTo] = useState(topic);
  const scroller = useRef<HTMLDivElement>(null);
  const sections = useMemo(() => searchBooklet(booklet, query), [booklet, query]);
  const topics = useMemo(() => [...new Set(booklet.sections.map((s) => s.topic))], [booklet]);
  // Chemistry's element data opens as a full-screen periodic table (undefined = closed, a Z = that element picked).
  const [table, setTable] = useState<number | null | undefined>(undefined);
  const hasTable = booklet.sections.some((s) => s.periodicTable);
  const elementHits = useMemo(() => (hasTable ? searchElements(query) : []), [hasTable, query]);

  // Follow the question: a new topic moves the booklet there.
  const [seenTopic, setSeenTopic] = useState(topic);
  if (topic !== seenTopic) {
    setSeenTopic(topic);
    setJumpTo(topic);
  }

  useEffect(() => {
    if (query) return;
    const box = scroller.current;
    const el = box?.querySelector<HTMLElement>(`[data-topic="${CSS.escape(jumpTo)}"]`);
    if (box && el) box.scrollTo({ top: el.offsetTop - box.offsetTop - 8, behavior: "smooth" });
  }, [jumpTo, query]);

  // Esc closes it (unless they're clearing the search).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if ((e.target as HTMLElement | null)?.tagName === "INPUT" && query) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, query]);

  return (
    <aside
      aria-label={booklet.title}
      className="fixed inset-x-0 bottom-[72px] z-40 h-[60vh] rounded-t-2xl border-t lg:sticky lg:top-36 lg:bottom-auto lg:left-auto lg:right-auto lg:z-auto lg:h-[calc(100vh-13rem)] lg:w-[380px] xl:w-[520px] 2xl:w-[600px] lg:shrink-0 lg:self-start lg:rounded-2xl lg:border bg-surface-container-lowest border-outline-variant shadow-xl lg:shadow-none flex flex-col"
    >
      <div className="p-md pb-sm flex flex-col gap-sm border-b border-outline-variant">
        <div className="flex items-center justify-between gap-sm">
          <p className="font-serif font-bold text-on-surface">
            {booklet.title} <span className="text-label-md font-sans font-semibold text-on-surface-variant">· {level}</span>
          </p>
          {hasTable && (
            <button
              type="button"
              onClick={() => setTable(null)}
              className="ml-auto inline-flex items-center gap-xs rounded-lg border border-outline-variant px-sm py-xs text-label-md font-semibold text-on-surface hover:border-primary hover:text-primary cursor-pointer"
            >
              <LayoutGrid size={14} aria-hidden="true" /> Periodic table
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close booklet" className="p-0.5 text-on-surface-variant hover:text-primary cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <label className="flex items-center gap-xs rounded-lg border border-outline-variant bg-surface px-sm py-xs focus-within:border-primary">
          <Search size={14} className="text-on-surface-variant shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={booklet.searchHint ?? "Search formulas"}
            aria-label={booklet.searchHint ?? "Search formulas"}
            className="w-full bg-transparent text-label-md text-on-surface placeholder:text-on-surface-variant outline-none"
          />
        </label>
        {!query && (
          <div className="flex gap-xs overflow-x-auto -mx-md px-md" role="group" aria-label="Topics">
            {topics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setJumpTo(t)}
                aria-pressed={jumpTo === t}
                className={`shrink-0 rounded-full px-sm py-px text-label-sm font-semibold cursor-pointer ${
                  jumpTo === t ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:text-primary"
                }`}
              >
                {t} {topicNames[t] ?? ""}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={scroller} className="relative flex-1 overflow-y-auto px-md py-sm">
        {elementHits.length > 0 && (
          <section className="py-sm" aria-label="Elements">
            <h3 className="font-semibold text-on-surface text-body-md pb-xs">Elements</h3>
            <ul className="flex flex-col divide-y divide-outline-variant">
              {elementHits.map((e) => (
                <li key={e.z}>
                  <button
                    type="button"
                    onClick={() => setTable(e.z)}
                    className="w-full flex items-center gap-sm py-xs text-left text-label-md hover:text-primary cursor-pointer"
                  >
                    <span className="w-9 h-9 shrink-0 rounded-md bg-primary text-on-primary flex flex-col items-center justify-center leading-none">
                      <span className="text-[9px] tabular-nums opacity-90">{e.z}</span>
                      <span className="font-bold">{e.symbol}</span>
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="font-semibold text-on-surface">{e.name}</span>
                      <span className="block text-on-surface-variant tabular-nums truncate">
                        Aᵣ {e.mass}
                        {e.electronegativity && ` · EN ${e.electronegativity}`}
                        {e.ionizationEnergy && ` · 1st IE ${e.ionizationEnergy} kJ mol⁻¹`}
                      </span>
                    </span>
                    <ArrowUpRight size={14} className="shrink-0 text-on-surface-variant" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {sections.length === 0 && elementHits.length === 0 && <p className="text-label-md text-on-surface-variant py-md">Nothing matches “{query}”.</p>}
        {sections.map((s, i) => {
          const firstOfTopic = i === 0 || sections[i - 1].topic !== s.topic;
          return (
            <section key={`${s.topic}-${s.title}`} data-topic={firstOfTopic ? s.topic : undefined} className="py-sm">
              {firstOfTopic && !query && (
                <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant pb-xs">
                  {s.topic} · {topicNames[s.topic] ?? "Topic"}
                  {s.topic === topic && <span className="ml-xs normal-case tracking-normal text-primary">(this question)</span>}
                </p>
              )}
              <h3 className="font-semibold text-on-surface text-body-md pb-xs">{s.title}</h3>
              {s.periodicTable && (
                <div className="rounded-xl border border-outline-variant bg-surface-container p-md flex flex-col gap-sm">
                  <p className="text-label-md text-on-surface-variant">
                    Atomic masses, electronegativities, ionization energies, electron affinities, radii, and melting and boiling points for every element, on an
                    interactive periodic table.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTable(null)}
                    className="self-start inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 cursor-pointer"
                  >
                    <LayoutGrid size={16} aria-hidden="true" /> Open the periodic table
                  </button>
                </div>
              )}
              {s.entries.length > 0 && (
                <ul className="flex flex-col divide-y divide-outline-variant">
                  {s.entries.map((e) => (
                    <li key={e.name} className="py-xs flex flex-col gap-0.5">
                      <p className="text-label-md text-on-surface-variant">{e.name}</p>
                      <div className="text-on-surface">
                        {e.math.map((m) => (
                          <Tex key={m} math={m} />
                        ))}
                        {e.condition && (
                          <span className="text-label-sm text-on-surface-variant flex items-baseline gap-1">
                            for <Tex math={e.condition} className="flex-1 min-w-0" />
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {s.tables?.map((t) => (
                <div key={t.caption} className="py-xs">
                  <p className="text-label-md text-on-surface-variant pb-xs">{t.caption}</p>
                  <div className="overflow-x-auto rounded-lg border border-outline-variant">
                    <table className="w-full text-label-md tabular-nums">
                      <thead className="bg-surface-container text-on-surface-variant text-left">
                        <tr>
                          {t.columns.map((c) => (
                            <th key={c} scope="col" className="font-semibold px-sm py-xs align-bottom min-w-12">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-on-surface">
                        {t.rows.map((r) => (
                          <tr key={r.join("|")} className="border-t border-outline-variant">
                            {r.map((cell, ci) => (
                              // Short cells (values, symbols) stay on one line; long ones (names, long values) wrap.
                              <td key={ci} className={`px-sm py-0.5 ${cell.length > 28 ? "min-w-40" : "whitespace-nowrap"}`}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>
          );
        })}
        <p className="text-label-sm text-on-surface-variant pt-md pb-sm">DiplomaHub’s own write-up of what the exam booklet gives. Your school’s IB booklet is the official one.</p>
      </div>
      {table !== undefined && <PeriodicTable initialZ={table} onClose={() => setTable(undefined)} />}
    </aside>
  );
}
