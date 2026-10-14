import Link from "next/link";
import { Check } from "lucide-react";
import type { GettingStarted } from "@/lib/data/types";
import { links } from "@/lib/practice/links";

const STEPS: { key: keyof GettingStarted; label: string; href: string; cta: string }[] = [
  { key: "pickSubjects", label: "Pick your subjects", href: links.practice(), cta: "Pick" },
  { key: "addCountdownTest", label: "Add your next test and tick “Show a countdown”", href: "/hub?add=1", cta: "Add" },
  { key: "finishFirstSet", label: "Finish your first set", href: links.practice(), cta: "Start" },
  { key: "saveOrEnterCode", label: "Save a set or enter a friend's code", href: links.practice(), cta: "Go" },
];

/** Shown on Home until every step is done, then it disappears for good. */
export function GettingStartedCard({ progress }: { progress: GettingStarted }) {
  const done = STEPS.filter((s) => progress[s.key]).length;
  if (done === STEPS.length) return null;

  return (
    <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md" aria-labelledby="getting-started">
      <div className="flex items-center justify-between gap-md">
        <h2 id="getting-started" className="font-serif font-bold text-headline-md text-on-surface">
          Getting started
        </h2>
        <span className="text-label-md text-on-surface-variant tabular-nums">
          {done} of {STEPS.length} done
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-container overflow-hidden" aria-hidden="true">
        <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${(done / STEPS.length) * 100}%` }} />
      </div>
      <ul className="grid sm:grid-cols-2 gap-sm">
        {STEPS.map((step) => {
          const isDone = progress[step.key];
          return (
            <li key={step.key} className="flex items-center gap-sm rounded-xl bg-surface-container-low px-md py-sm">
              <span
                className={`w-5 h-5 shrink-0 rounded-[50%] border flex items-center justify-center ${
                  isDone ? "bg-secondary border-secondary text-on-secondary" : "border-outline"
                }`}
                aria-hidden="true"
              >
                {isDone && <Check size={12} strokeWidth={3} />}
              </span>
              <span className={`flex-1 text-body-md ${isDone ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                {step.label}
                <span className="sr-only">{isDone ? " (done)" : ""}</span>
              </span>
              {!isDone && (
                <Link href={step.href} className="text-label-md font-semibold text-primary hover:underline">
                  {step.cta}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
