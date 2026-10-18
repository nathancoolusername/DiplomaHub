"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { ELEMENTS, elementPosition, type ElementData } from "@/lib/booklets/elements";

type PropertyKey = Exclude<keyof ElementData, "z" | "symbol" | "name">;

/** What the table can show, in the order of the switcher. */
const PROPERTIES: { key: PropertyKey; label: string; unit: string }[] = [
  { key: "mass", label: "Atomic mass", unit: "Aᵣ" },
  { key: "electronegativity", label: "Electronegativity", unit: "Pauling scale" },
  { key: "ionizationEnergy", label: "First ionization energy", unit: "kJ mol⁻¹" },
  { key: "electronAffinity", label: "Electron affinity", unit: "kJ mol⁻¹ (2nd EA in brackets)" },
  { key: "atomicRadius", label: "Atomic radius", unit: "10⁻¹² m (covalent)" },
  { key: "ionicRadius", label: "Ionic radius", unit: "10⁻¹² m (charge)" },
  { key: "meltingPoint", label: "Melting point", unit: "°C at 101.325 kPa" },
  { key: "boilingPoint", label: "Boiling point", unit: "°C at 101.325 kPa" },
];

/** The first number in a printed value ("−141 (+753)" → −141, "(98)" → 98), for shading. */
function firstNumber(v: string): number | null {
  const m = v.replace(/−/g, "-").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/** What fits in a cell: ionic radii show their first ion only ("61 (2+), 55 (3+)" → "61²⁺"). */
const SUPERSCRIPT: Record<string, string> = { "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "+": "⁺", "−": "⁻" };
function cellValue(key: PropertyKey, v: string): string {
  if (!v) return "–";
  if (key === "ionicRadius") {
    const m = v.match(/^(\d+) \(([+−]?\d?[+−]?)\)/);
    return m ? m[1] + [...m[2].replace(/^\+(\d)$/, "$1+")].map((c) => SUPERSCRIPT[c] ?? c).join("") : v;
  }
  if (key === "electronAffinity") return v.replace(/ \(.*\)$/, "");
  return v;
}

const DETAIL_ROWS: { key: PropertyKey; label: string; unit: string }[] = [
  { key: "mass", label: "Relative atomic mass", unit: "" },
  { key: "electronegativity", label: "Electronegativity", unit: "" },
  { key: "ionizationEnergy", label: "First ionization energy", unit: "kJ mol⁻¹" },
  { key: "electronAffinity", label: "Electron affinity", unit: "kJ mol⁻¹" },
  { key: "atomicRadius", label: "Atomic radius", unit: "× 10⁻¹² m" },
  { key: "ionicRadius", label: "Ionic radius", unit: "× 10⁻¹² m" },
  { key: "meltingPoint", label: "Melting point", unit: "°C" },
  { key: "boilingPoint", label: "Boiling point", unit: "°C" },
];

const BY_POSITION = new Map(ELEMENTS.map((e) => [`${elementPosition(e.z).row},${elementPosition(e.z).col}`, e]));

/**
 * The Chemistry booklet's element data as an interactive periodic table, over
 * the whole screen with the page dimmed behind it. Switch what it shows
 * (atomic mass, electronegativity …); cells are shaded by value; pick an
 * element (click, or arrow keys) to see everything the booklet gives for it.
 * Esc, the close button or a click outside closes it.
 */
export function PeriodicTable({ initialZ = null, onClose }: { initialZ?: number | null; onClose: () => void }) {
  const [property, setProperty] = useState<PropertyKey>("mass");
  const [selected, setSelected] = useState<number>(initialZ ?? 26);
  const [hovered, setHovered] = useState<number | null>(null);
  const [find, setFind] = useState("");
  const cells = useRef(new Map<number, HTMLButtonElement>());

  const prop = PROPERTIES.find((p) => p.key === property)!;
  const range = useMemo(() => {
    const nums = ELEMENTS.map((e) => firstNumber(e[property])).filter((n): n is number => n !== null);
    return { min: Math.min(...nums), max: Math.max(...nums) };
  }, [property]);

  const findQuery = find.trim().toLowerCase();
  const matchesFind = (e: ElementData) =>
    !findQuery || e.symbol.toLowerCase() === findQuery || e.name.toLowerCase().startsWith(findQuery) || String(e.z) === findQuery;

  const shown = ELEMENTS.find((e) => e.z === (hovered ?? selected)) ?? ELEMENTS[0];

  const move = (z: number) => {
    setSelected(z);
    cells.current.get(z)?.focus();
  };

  // Keys stay in here: Esc closes, arrows move around the table, and the
  // player's own shortcuts (B, ← →) don't fire underneath.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      const typing = (e.target as HTMLElement | null)?.tagName === "INPUT";
      // P (the shortcut that opens it) closes it again.
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key) && !typing) {
        e.preventDefault();
        e.stopPropagation();
        const here = elementPosition(selected);
        if (e.key === "ArrowLeft" && selected > 1) move(selected - 1);
        else if (e.key === "ArrowRight" && selected < 118) move(selected + 1);
        else {
          const step = e.key === "ArrowUp" ? -1 : 1;
          for (let row = here.row + step; row >= 1 && row <= 10; row += step) {
            const next = BY_POSITION.get(`${row},${here.col}`);
            if (next) {
              move(next.z);
              break;
            }
          }
        }
        return;
      }
      if (!typing && (e.key === "b" || e.key === "B")) e.stopPropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  // Focus moves in, the page behind stops scrolling, and focus goes back where it was on close.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cells.current.get(initialZ ?? 26)?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, [initialZ]);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-sm md:p-lg">
      <div className="periodic-scrim overlay-dim absolute inset-0 bg-scrim/75" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="periodic-table-title"
        className="periodic-panel overlay-pop relative w-full max-w-[1240px] max-h-full overflow-auto rounded-2xl border border-outline-variant shadow-2xl p-md md:p-lg flex flex-col gap-md"
      >
        <header className="flex flex-wrap items-center gap-sm">
          <h2 id="periodic-table-title" className="font-serif font-bold text-headline-sm text-on-surface mr-auto">
            Periodic table
          </h2>
          <label className="flex items-center gap-xs rounded-lg border border-outline-variant bg-surface px-sm py-xs focus-within:border-primary">
            <Search size={14} className="text-on-surface-variant shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={find}
              onChange={(e) => {
                setFind(e.target.value);
                const q = e.target.value.trim().toLowerCase();
                const hit = q && ELEMENTS.find((el) => el.symbol.toLowerCase() === q || el.name.toLowerCase().startsWith(q) || String(el.z) === q);
                if (hit) setSelected(hit.z);
              }}
              placeholder="Find an element"
              aria-label="Find an element"
              className="w-36 bg-transparent text-label-md text-on-surface placeholder:text-on-surface-variant outline-none"
            />
          </label>
          <button type="button" onClick={onClose} aria-label="Close periodic table" className="p-xs text-on-surface-variant hover:text-primary cursor-pointer">
            <X size={20} />
          </button>
        </header>

        <div role="radiogroup" aria-label="Show" className="flex gap-xs overflow-x-auto -mx-md px-md md:mx-0 md:px-0 md:flex-wrap">
          {PROPERTIES.map((p) => (
            <button
              key={p.key}
              type="button"
              role="radio"
              aria-checked={property === p.key}
              onClick={() => setProperty(p.key)}
              className={`shrink-0 rounded-full px-md py-xs text-label-md font-semibold cursor-pointer ${
                property === p.key ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:text-primary"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="shrink-0 overflow-x-auto -mx-md px-md md:mx-0 md:px-0">
          <div
            className="grid gap-[3px] min-w-[760px]"
            style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))", gridTemplateRows: "repeat(7, auto) 0.75rem repeat(2, auto)" }}
          >
            {/* Everything about the element in focus, in the gap above the transition metals. */}
            <div
              aria-live="polite"
              className="hidden sm:flex items-start gap-md rounded-xl bg-surface-container-lowest border border-outline-variant p-sm"
              style={{ gridColumn: "3 / 13", gridRow: "1 / 4" }}
            >
              <div className="shrink-0 w-20 h-20 rounded-lg bg-primary text-on-primary flex flex-col items-center justify-center">
                <span className="text-label-sm tabular-nums opacity-90">{shown.z}</span>
                <span className="font-serif font-bold text-headline-md leading-none">{shown.symbol}</span>
                <span className="text-label-sm tabular-nums opacity-90">{shown.mass}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-on-surface">{shown.name}</p>
                <dl className="grid grid-cols-2 gap-x-md text-label-sm">
                  {DETAIL_ROWS.slice(1).map((r) => (
                    <div key={r.key} className="flex justify-between gap-sm border-b border-outline-variant/60 py-px">
                      <dt className="text-on-surface-variant truncate">{r.label}</dt>
                      <dd className={`text-right tabular-nums ${r.key === property ? "font-bold text-primary" : "text-on-surface"}`}>
                        {shown[r.key] || "–"}
                        {shown[r.key] && r.unit && <span className="ml-1 font-normal text-on-surface-variant">{r.unit}</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {ELEMENTS.map((e) => {
              const { row, col } = elementPosition(e.z);
              const raw = e[property];
              const n = firstNumber(raw);
              // Shaded by value: the higher, the stronger the colour.
              const t = n === null || range.max === range.min ? null : (n - range.min) / (range.max - range.min);
              const pct = t === null ? 0 : Math.round(10 + t * 72);
              const dark = pct > 55;
              const isSelected = e.z === selected;
              return (
                <button
                  key={e.z}
                  ref={(el) => {
                    if (el) cells.current.set(e.z, el);
                    else cells.current.delete(e.z);
                  }}
                  type="button"
                  onClick={() => setSelected(e.z)}
                  onMouseEnter={() => setHovered(e.z)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setSelected(e.z)}
                  aria-label={`${e.name}, ${prop.label}: ${raw || "not given"}`}
                  aria-pressed={isSelected}
                  style={{
                    gridRow: row,
                    gridColumn: col,
                    background:
                      t === null
                        ? undefined
                        : `color-mix(in srgb, var(--color-primary) ${pct}%, var(--color-surface-container-lowest))`,
                  }}
                  className={`relative aspect-square min-w-0 rounded-md border flex flex-col items-center justify-center leading-none cursor-pointer transition-[opacity,box-shadow] ${
                    t === null ? "bg-surface-container border-outline-variant text-on-surface-variant" : "border-transparent"
                  } ${dark ? "text-on-primary" : "text-on-surface"} ${isSelected ? "ring-2 ring-offset-1 ring-offset-surface-raised ring-tertiary z-10" : ""} ${
                    matchesFind(e) ? "" : "opacity-25"
                  }`}
                >
                  <span className="absolute top-0.5 left-1 text-[9px] tabular-nums opacity-80">{e.z}</span>
                  <span className="font-bold text-label-md">{e.symbol}</span>
                  <span className="text-[9px] tabular-nums opacity-90 mt-0.5 truncate max-w-full px-0.5">{cellValue(property, raw)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* On phones the detail card has no room in the grid: it goes underneath. */}
        <div className="sm:hidden rounded-xl bg-surface-container-lowest border border-outline-variant p-sm text-label-md">
          <p className="font-semibold text-on-surface">
            {shown.z} {shown.symbol} · {shown.name} · Aᵣ {shown.mass}
          </p>
          <dl className="grid grid-cols-2 gap-x-md text-label-sm">
            {DETAIL_ROWS.slice(1).map((r) => (
              <div key={r.key} className="flex justify-between gap-sm py-px">
                <dt className="text-on-surface-variant">{r.label}</dt>
                <dd className="tabular-nums text-on-surface">{shown[r.key] || "–"}</dd>
              </div>
            ))}
          </dl>
        </div>

        <footer className="flex flex-wrap items-center gap-md text-label-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">
            {prop.label} <span className="font-normal text-on-surface-variant">/ {prop.unit}</span>
          </span>
          <span className="inline-flex items-center gap-xs">
            <span className="tabular-nums">{range.min}</span>
            <span
              aria-hidden="true"
              className="w-28 h-2 rounded-full"
              style={{ background: "linear-gradient(to right, color-mix(in srgb, var(--color-primary) 10%, var(--color-surface-container-lowest)), var(--color-primary))" }}
            />
            <span className="tabular-nums">{range.max}</span>
          </span>
          <span>Grey: not given. Arrow keys move; Esc or P closes.</span>
          <span className="ml-auto">Values from the IB Chemistry data booklet (2025).</span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
