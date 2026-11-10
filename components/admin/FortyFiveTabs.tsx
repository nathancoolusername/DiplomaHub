import Link from "next/link";

/** Puzzles | Insights switch inside Admin → Forty-Five. */
export function FortyFiveTabs({ current }: { current: "puzzles" | "insights" }) {
  const tabs = [
    { key: "puzzles", href: "/admin/forty-five", label: "Puzzles" },
    { key: "insights", href: "/admin/forty-five/insights", label: "Insights" },
  ] as const;
  return (
    <nav aria-label="Forty-Five admin" className="inline-flex rounded-full border border-outline-variant bg-surface-container-lowest p-0.5">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === current ? "page" : undefined}
          className={`rounded-full px-md py-1 text-label-md font-semibold transition-colors ${t.key === current ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
