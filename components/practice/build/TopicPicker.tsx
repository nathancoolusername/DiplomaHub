"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { StrengthMap } from "@/lib/data/types";
import { STRENGTH_LABELS } from "@/lib/practice/strength";
import { comingSoonIds } from "@/lib/practice/coming-soon";

function TopicCheckbox({ state, onChange, label }: { state: "all" | "some" | "none"; onChange: () => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={state === "all"}
      onChange={onChange}
      aria-label={label}
      className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
    />
  );
}

/**
 * Topic → subtopic checkboxes. Ticking a topic ticks all its subtopics.
 * Each subtopic shows its strength as a small tile. Nothing ticked means
 * the whole syllabus.
 */
export function TopicPicker({
  map,
  selected,
  onChange,
  includeHl,
  weakIds,
}: {
  map: StrengthMap;
  selected: string[];
  onChange: (ids: string[]) => void;
  includeHl: boolean;
  weakIds: string[];
}) {
  const soon = comingSoonIds(map.subject.id);
  const chosen = new Set(selected.filter((id) => !soon.has(id)));
  // Groups start open when partly ticked (e.g. arriving from a strength tile), then follow the student.
  const [openTopics, setOpenTopics] = useState<Set<string>>(
    () =>
      new Set(
        map.topics
          .filter((t) => {
            const n = t.subtopics.filter((s) => chosen.has(s.id)).length;
            return n > 0 && n < t.subtopics.length;
          })
          .map((t) => t.code),
      ),
  );
  const topics = map.topics
    .map((t) => ({ ...t, subtopics: t.subtopics.filter((s) => includeHl || !s.hlOnly) }))
    .filter((t) => t.subtopics.length > 0);

  const toggle = (ids: string[], on: boolean) => {
    const next = new Set(chosen);
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
    onChange([...next]);
  };

  const weakSelected = weakIds.length > 0 && weakIds.every((id) => chosen.has(id)) && chosen.size === weakIds.length;

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex flex-wrap items-center gap-xs">
        <button
          type="button"
          onClick={() => onChange(weakSelected ? [] : weakIds)}
          disabled={weakIds.length === 0}
          aria-pressed={weakSelected}
          title={weakIds.length === 0 ? "Practise a little first: weak topics show up once there's enough data" : undefined}
          className={`rounded-full px-md py-xs text-label-md font-semibold border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
            weakSelected ? "bg-primary text-on-primary border-primary" : "border-outline-variant text-on-surface hover:border-primary"
          }`}
        >
          My weak topics{weakIds.length > 0 ? ` (${weakIds.length})` : ""}
        </button>
        {selected.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-label-md text-on-surface-variant hover:text-primary cursor-pointer px-sm">
            Clear
          </button>
        )}
        <span className="ml-auto text-label-sm text-on-surface-variant">
          {selected.length === 0 ? "No topics ticked: the whole syllabus" : `${selected.length} ticked`}
        </span>
      </div>

      <ul className="flex flex-col rounded-xl border border-outline-variant divide-y divide-outline-variant max-h-[460px] overflow-y-auto">
        {topics.map((t) => {
          const ids = t.subtopics.filter((s) => !soon.has(s.id)).map((s) => s.id);
          const count = ids.filter((id) => chosen.has(id)).length;
          const state = count === 0 ? "none" : count === ids.length ? "all" : "some";
          return (
            <li key={t.code}>
              <details
                open={openTopics.has(t.code)}
                onToggle={(e) => {
                  const isOpen = e.currentTarget.open;
                  setOpenTopics((prev) => {
                    if (prev.has(t.code) === isOpen) return prev;
                    const next = new Set(prev);
                    if (isOpen) next.add(t.code);
                    else next.delete(t.code);
                    return next;
                  });
                }}
                className="group"
              >
                <summary className="flex items-center gap-sm px-md py-sm cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-surface-container-low">
                  <TopicCheckbox state={state} onChange={() => toggle(ids, state !== "all")} label={`All of ${t.name}`} />
                  <span className="flex-1 text-body-md font-semibold text-on-surface">{t.name}</span>
                  <span className="text-label-sm text-on-surface-variant tabular-nums">
                    {count > 0 ? `${count}/` : ""}
                    {ids.length}
                  </span>
                  <ChevronDown size={16} className="text-on-surface-variant transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <ul className="pb-sm">
                  {t.subtopics.map((s) => (
                    <li key={s.id}>
                      <label
                        className={`flex items-center gap-sm pl-xl pr-md py-xs ${soon.has(s.id) ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-surface-container-low"}`}
                        title={soon.has(s.id) ? `${s.name} (coming soon)` : s.name}
                      >
                        <input
                          type="checkbox"
                          checked={chosen.has(s.id)}
                          disabled={soon.has(s.id)}
                          onChange={(e) => toggle([s.id], e.target.checked)}
                          className="w-4 h-4 accent-[var(--color-primary)] cursor-pointer"
                        />
                        <span className="w-12 shrink-0 text-label-sm font-semibold text-on-surface-variant tabular-nums">{s.code}</span>
                        <span className="flex-1 min-w-0 truncate text-label-md text-on-surface">{s.shortName}</span>
                        {s.hlOnly && <span className="text-[10px] font-bold text-on-surface-variant">HL</span>}
                        {soon.has(s.id) ? (
                          <span className="rounded-full bg-surface-container-high px-sm py-0.5 text-[10px] font-bold text-on-surface-variant shrink-0">Coming soon</span>
                        ) : (
                          <span
                            data-level={s.level}
                            className="strength-tile w-4 h-3 rounded-sm shrink-0"
                            aria-label={STRENGTH_LABELS[s.level]}
                            title={STRENGTH_LABELS[s.level]}
                          />
                        )}
                      </label>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
