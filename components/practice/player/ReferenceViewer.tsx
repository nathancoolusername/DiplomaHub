"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LayoutGrid, Search, Shapes, Table2, X } from "lucide-react";
import { referenceItems, type Booklet, type BookletTable, type ReferenceItem } from "@/lib/booklets";
import { DIAGRAMS } from "./diagrams";
import { PeriodicTable } from "./PeriodicTable";

/**
 * A booklet's reference material (Chemistry, Biology) over the whole screen
 * with the page dimmed behind it: the periodic table, every data table and
 * our own diagrams, listed by topic on the left. ↑ / ↓ switch items (the
 * periodic table keeps the arrows for moving between elements), Esc closes,
 * and P / D (the shortcuts that open it) jump to the periodic table or close.
 */
export function ReferenceViewer({
  booklet,
  topicNames,
  initialItem,
  initialQuery = "",
  initialZ = null,
  onClose,
}: {
  booklet: Booklet;
  topicNames: Record<string, string>;
  /** "periodic", "table:…" or "diagram:…"; the first item if left out. */
  initialItem?: string;
  /** Prefills the open table's filter (from a booklet search). */
  initialQuery?: string;
  /** Element to start the periodic table on. */
  initialZ?: number | null;
  onClose: () => void;
}) {
  const items = useMemo(() => referenceItems(booklet), [booklet]);
  const [current, setCurrent] = useState(() => items.find((i) => i.id === initialItem)?.id ?? items[0]?.id);
  const [find, setFind] = useState("");
  const item = items.find((i) => i.id === current) ?? items[0];
  const listRef = useRef<HTMLDivElement>(null);

  const shownItems = useMemo(() => {
    const q = find.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      const extra = i.kind === "table" ? [...(i.table.keywords ?? []), ...i.table.rows.flat()] : i.kind === "diagram" ? [i.diagram.caption, ...(i.diagram.keywords ?? [])] : ["elements", "periodic"];
      return [i.title, ...extra].join(" ").toLowerCase().includes(q);
    });
  }, [items, find]);

  const step = (dir: 1 | -1) => {
    const list = shownItems.length ? shownItems : items;
    const at = Math.max(0, list.findIndex((i) => i.id === item?.id));
    const next = list[Math.min(list.length - 1, Math.max(0, at + dir))];
    if (next) setCurrent(next.id);
  };

  // Keys stay in here so the player's shortcuts don't fire underneath.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement | null)?.tagName ?? "");
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "p" && items.some((i) => i.kind === "periodic")) {
        e.preventDefault();
        e.stopPropagation();
        if (item?.kind === "periodic") onClose();
        else setCurrent("periodic");
      } else if (k === "d") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        step(e.key === "ArrowDown" ? 1 : -1);
      } else if (k === "b" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  // The page behind stops scrolling; focus comes back where it was on close.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, []);

  // Keep the current item in view in the sidebar.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-item="${CSS.escape(item?.id ?? "")}"]`)?.scrollIntoView({ block: "nearest" });
  }, [item?.id]);

  if (!item) return null;

  // Sidebar groups, in booklet order.
  const groups: { topic: string; items: ReferenceItem[] }[] = [];
  for (const i of shownItems) {
    const g = groups.find((x) => x.topic === i.topic);
    if (g) g.items.push(i);
    else groups.push({ topic: i.topic, items: [i] });
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-sm md:p-lg">
      <div className="periodic-scrim overlay-dim absolute inset-0 bg-scrim/75" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reference-title"
        className="periodic-panel overlay-pop relative w-full max-w-[1360px] h-full max-h-[920px] rounded-2xl border border-outline-variant shadow-2xl flex flex-col md:flex-row overflow-hidden"
      >
        {/* Sidebar (a dropdown on phones) */}
        <nav aria-label="Tables and diagrams" className="md:w-72 md:shrink-0 border-b md:border-b-0 md:border-r border-outline-variant flex flex-col min-h-0">
          <div className="p-md pb-sm flex flex-col gap-sm">
            <p id="reference-title" className="font-serif font-bold text-on-surface">
              {booklet.title.replace(/ data booklet$/, "")} reference
            </p>
            <label className="flex items-center gap-xs rounded-lg border border-outline-variant bg-surface px-sm py-xs focus-within:border-primary">
              <Search size={14} className="text-on-surface-variant shrink-0" aria-hidden="true" />
              <input
                type="search"
                value={find}
                onChange={(e) => setFind(e.target.value)}
                placeholder="Find a table or diagram"
                aria-label="Find a table or diagram"
                className="w-full bg-transparent text-label-md text-on-surface placeholder:text-on-surface-variant outline-none"
              />
            </label>
            <select
              aria-label="Show"
              value={item.id}
              onChange={(e) => setCurrent(e.target.value)}
              className="md:hidden rounded-lg border border-outline-variant bg-surface px-sm py-xs text-label-md text-on-surface"
            >
              {groups.map((g) => (
                <optgroup key={g.topic} label={`${g.topic} · ${topicNames[g.topic] ?? ""}`}>
                  {g.items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div ref={listRef} className="hidden md:block flex-1 overflow-y-auto px-sm pb-md">
            {groups.length === 0 && <p className="px-sm text-label-md text-on-surface-variant">Nothing matches “{find}”.</p>}
            {groups.map((g) => (
              <div key={g.topic} className="pt-sm">
                <p className="px-sm pb-xs text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant truncate">
                  {g.topic} · {topicNames[g.topic] ?? ""}
                </p>
                <ul>
                  {g.items.map((i) => (
                    <li key={i.id}>
                      <button
                        type="button"
                        data-item={i.id}
                        onClick={() => setCurrent(i.id)}
                        aria-current={i.id === item.id ? "true" : undefined}
                        className={`w-full flex items-center gap-sm rounded-lg px-sm py-xs text-left text-label-md cursor-pointer ${
                          i.id === item.id ? "bg-primary text-on-primary font-semibold" : "text-on-surface hover:bg-surface-container"
                        }`}
                      >
                        <ItemIcon item={i} />
                        <span className="flex-1 min-w-0 truncate">{i.title}</span>
                        {i.kind === "diagram" && i.diagram.hl && (
                          <span className={`shrink-0 rounded px-1 text-[10px] font-bold ${i.id === item.id ? "bg-on-primary/20" : "bg-surface-container text-on-surface-variant"}`}>HL</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* The item */}
        <section className="flex-1 min-w-0 min-h-0 flex flex-col">
          <header className="flex items-start gap-sm px-md md:px-lg pt-md pb-sm">
            <div className="min-w-0 flex-1">
              <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
                {item.topic} · {topicNames[item.topic] ?? ""}
                {item.kind === "diagram" && item.diagram.hl && <span className="ml-xs text-primary">HL only</span>}
              </p>
              <h2 className="font-serif font-bold text-headline-sm text-on-surface">{item.title}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="p-xs text-on-surface-variant hover:text-primary cursor-pointer">
              <X size={20} />
            </button>
          </header>
          <div className="flex-1 min-h-0 overflow-auto px-md md:px-lg pb-md">
            {item.kind === "periodic" && <PeriodicTable initialZ={initialZ} />}
            {item.kind === "table" && <TableView key={item.id} table={item.table} initialQuery={item.id === initialItem ? initialQuery : ""} />}
            {item.kind === "diagram" && <DiagramView item={item} />}
          </div>
          <footer className="hidden md:flex items-center gap-md px-lg py-xs border-t border-outline-variant text-label-sm text-on-surface-variant">
            <span>↑ ↓ switch</span>
            {items.some((i) => i.kind === "periodic") && <span>P periodic table</span>}
            <span>Esc close</span>
            <span className="ml-auto">Drawn by DiplomaHub from the IB data booklet. Your school’s booklet is the official one.</span>
          </footer>
        </section>
      </div>
    </div>,
    document.body,
  );
}

function ItemIcon({ item }: { item: ReferenceItem }) {
  const Icon = item.kind === "periodic" ? LayoutGrid : item.kind === "table" ? Table2 : Shapes;
  return <Icon size={14} className="shrink-0 opacity-80" aria-hidden="true" />;
}

/** A data table at full size: sticky header, zebra rows, its own filter. */
function TableView({ table, initialQuery }: { table: BookletTable; initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const rows = words.length ? table.rows.filter((r) => words.every((w) => r.join(" ").toLowerCase().includes(w))) : table.rows;
  return (
    <div className="flex flex-col gap-sm">
      {table.rows.length > 8 && (
        <div className="flex items-center gap-sm">
          <label className="flex items-center gap-xs rounded-lg border border-outline-variant bg-surface px-sm py-xs focus-within:border-primary w-full max-w-80">
            <Search size={14} className="text-on-surface-variant shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter rows"
              aria-label="Filter rows"
              className="w-full bg-transparent text-label-md text-on-surface placeholder:text-on-surface-variant outline-none"
            />
          </label>
          <span className="text-label-sm text-on-surface-variant tabular-nums">
            {rows.length} of {table.rows.length}
          </span>
        </div>
      )}
      <div className="overflow-auto rounded-xl border border-outline-variant">
        <table className="w-full text-body-md tabular-nums">
          <thead className="sticky top-0 z-10 bg-surface-container text-on-surface-variant text-left text-label-md">
            <tr>
              {table.columns.map((c) => (
                <th key={c} scope="col" className="font-semibold px-md py-sm align-bottom">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-on-surface">
            {rows.map((r) => (
              <tr key={r.join("|")} className="border-t border-outline-variant even:bg-surface-container/40">
                {r.map((cell, ci) => (
                  <td key={ci} className={`px-md py-xs ${ci === 0 ? "font-semibold" : ""} ${cell.length > 28 ? "min-w-48" : "whitespace-nowrap"}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={table.columns.length} className="px-md py-md text-on-surface-variant">
                  No rows match “{q}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** One of our drawings, with its caption and key facts. */
function DiagramView({ item }: { item: Extract<ReferenceItem, { kind: "diagram" }> }) {
  const Drawing = DIAGRAMS[item.diagram.id];
  return (
    <div className="flex flex-col lg:flex-row gap-lg h-full">
      <div className="flex-1 min-w-0 min-h-64 rounded-xl bg-surface-container-lowest border border-outline-variant p-md flex items-center justify-center">
        {Drawing ? <Drawing /> : <p className="text-on-surface-variant">This drawing isn’t available yet.</p>}
      </div>
      <aside className="lg:w-72 lg:shrink-0 flex flex-col gap-sm">
        <p className="text-body-md text-on-surface">{item.diagram.caption}</p>
        {item.diagram.facts && item.diagram.facts.length > 0 && (
          <ul className="flex flex-col gap-xs text-label-md text-on-surface-variant list-disc pl-md">
            {item.diagram.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
