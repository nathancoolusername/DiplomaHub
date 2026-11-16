import { CalendarDays, CalendarRange, Crown, ListChecks } from "lucide-react";
import { CODE_TYPE_INFO } from "@/lib/codes";

const CARDS = [
  { key: "practice_set", icon: ListChecks, example: "K7MPX" },
  { key: "hub_item", icon: CalendarDays, example: "T4QWB" },
  { key: "hub_set", icon: CalendarRange, example: "M4HQB" },
  { key: "pro_trial", icon: Crown, example: "R8VN3-HD2KA" },
] as const;

/** "What you can share": one card per kind of code. */
export function ShareableTypes() {
  return (
    <div className="grid sm:grid-cols-2 gap-md">
      {CARDS.map(({ key, icon: Icon, example }) => {
        const info = CODE_TYPE_INFO[key];
        return (
          <article key={key} className="flex flex-col gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
            <div className="flex items-center justify-between gap-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="font-mono text-label-sm font-bold tracking-widest text-on-surface-variant" aria-label={`Looks like ${example}`}>
                {example}
              </span>
            </div>
            <h3 className="font-serif font-bold text-headline-sm text-on-surface">{info.label}</h3>
            <p className="text-label-md text-on-surface-variant">{info.body}</p>
            <p className="mt-auto text-label-sm text-on-surface-variant">
              {info.length} characters{key === "pro_trial" ? " · from DiplomaHub only" : " · anyone can share"}
            </p>
          </article>
        );
      })}
    </div>
  );
}
