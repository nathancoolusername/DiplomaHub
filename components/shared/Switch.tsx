"use client";

/**
 * On/off toggle. Track and knob use solid tokens (outline / primary /
 * switch-thumb), so it stays visible on Midnight's translucent cards.
 */
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={`inline-flex items-center gap-sm text-label-md text-on-surface select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-[999px] bg-outline transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
        />
        <span
          aria-hidden="true"
          className="absolute left-0.5 h-5 w-5 rounded-[50%] bg-switch-thumb shadow-sm transition peer-checked:translate-x-5 peer-checked:bg-on-primary"
        />
      </span>
      {label}
    </label>
  );
}
