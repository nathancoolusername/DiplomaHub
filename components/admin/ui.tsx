import Link from "next/link";
import { RANGES, type Range } from "@/app/lib/admin-stats";

// Shared building blocks for the admin pages.

export const CHART_1 = "var(--color-chart-1)";
export const CHART_2 = "var(--color-chart-2)";
export const CHART_3 = "var(--color-chart-3)";

export function PageHeader({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-md">
      <div className="flex flex-col gap-xs">
        <h2 className="font-serif font-bold text-headline-lg text-on-surface">{title}</h2>
        {description && <p className="text-body-md text-on-surface-variant max-w-160">{description}</p>}
      </div>
      {right}
    </div>
  );
}

/** 7 / 30 / 90 days, as links so the page stays a server component. */
export function RangeSelect({ basePath, range }: { basePath: string; range: Range }) {
  return (
    <nav aria-label="Time range" className="inline-flex rounded-full border border-outline-variant bg-surface-container-lowest p-0.5">
      {RANGES.map((r) => (
        <Link
          key={r}
          href={r === 30 ? basePath : `${basePath}?range=${r}`}
          aria-current={r === range ? "true" : undefined}
          className={`rounded-full px-md py-1 text-label-md font-semibold transition-colors ${
            r === range ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"
          }`}
        >
          {r}d
        </Link>
      ))}
    </nav>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: number | string;
  hint?: string;
  /** Tinted card for the one number that matters most on the page. */
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-xs rounded-2xl border p-lg min-w-0 ${
        accent ? "bg-primary text-on-primary border-primary" : "bg-surface-container-lowest border-outline-variant text-on-surface"
      }`}
    >
      <p className={`text-label-md font-semibold ${accent ? "text-on-primary/80" : "text-on-surface-variant"}`}>{label}</p>
      <p className="font-serif font-bold text-display-lg leading-none tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {hint && <p className={`text-label-md ${accent ? "text-on-primary/80" : "text-on-surface-variant"}`}>{hint}</p>}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">{children}</div>;
}

export function Panel({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`flex flex-col gap-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg min-w-0 ${className}`}>
      <div>
        <h3 className="font-serif font-bold text-headline-md text-on-surface">{title}</h3>
        {description && <p className="text-label-md text-on-surface-variant">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-outline-variant px-md py-lg text-center text-body-md text-on-surface-variant">{children}</p>;
}

/** Shown when a stats call fails: nearly always because migration 19 (or 17/18) hasn't been run yet. */
export function StatsError({ error }: { error: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-error bg-error-container text-on-error-container p-lg flex flex-col gap-xs">
      <p className="font-semibold">Couldn&apos;t load these numbers.</p>
      <p className="text-body-md">
        {error}. If it says a function doesn&apos;t exist, run the latest migrations in <code>supabase/migrations</code> (see the README).
      </p>
    </div>
  );
}

export function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%";
}
