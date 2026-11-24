import Link from "next/link";

export type DeadlineTab = "prompts" | "analytics" | "review" | "reports";

/** Prompts | Analytics | Missing answers | Reports inside Admin → Deadline. Counts show what's waiting. */
export function DeadlineTabs({ current, waiting }: { current: DeadlineTab; waiting?: { review?: number; reports?: number } }) {
  const tabs = [
    { key: "prompts", href: "/admin/deadline", label: "Prompts" },
    { key: "analytics", href: "/admin/deadline/analytics", label: "Analytics" },
    { key: "review", href: "/admin/deadline/review", label: "Missing answers", n: waiting?.review },
    { key: "reports", href: "/admin/deadline/reports", label: "Reports", n: waiting?.reports },
  ] as const;
  return (
    <nav aria-label="Deadline admin" className="inline-flex max-w-full overflow-x-auto rounded-full border border-outline-variant bg-surface-container-lowest p-0.5">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === current ? "page" : undefined}
          className={`shrink-0 whitespace-nowrap rounded-full px-md py-1 text-label-md font-semibold transition-colors ${t.key === current ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"}`}
        >
          {t.label}
          {"n" in t && t.n ? <span className={`ml-xs rounded-full px-1.5 text-label-sm tabular-nums ${t.key === current ? "bg-on-primary/20" : "bg-error text-on-error"}`}>{t.n}</span> : null}
        </Link>
      ))}
    </nav>
  );
}
