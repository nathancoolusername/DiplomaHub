"use client";

/** A row of mutually exclusive options (HL/SL, Easier/Exam level/Harder …). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  size = "md",
}: {
  value: T;
  options: { value: T; label: React.ReactNode; disabled?: boolean }[];
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-0.5 rounded-xl bg-surface-container p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              size === "sm" ? "px-sm py-0.5 text-label-sm" : "px-md py-xs text-label-md"
            } ${active ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
