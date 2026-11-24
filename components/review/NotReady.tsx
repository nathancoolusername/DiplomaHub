import { Wrench } from "lucide-react";

/** Shown when the coursework review tables (migration 65) aren't in the database yet. */
export function NotReady() {
  return (
    <div className="max-w-[720px] mx-auto px-md py-xl">
      <section className="rounded-2xl border border-dashed border-outline-variant p-xl flex flex-col items-center text-center gap-sm">
        <Wrench size={28} className="text-primary" aria-hidden="true" />
        <h1 className="font-serif font-bold text-headline-md text-on-surface">Coursework review is almost here</h1>
        <p className="text-body-md text-on-surface-variant max-w-[480px]">It isn&apos;t switched on yet. Check back soon.</p>
      </section>
    </div>
  );
}
