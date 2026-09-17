import Link from "next/link";
import { BookOpen, CalendarRange, CheckCircle2 } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="bg-surface-container-low px-md py-xl">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-lg">
        <h2 className="text-headline-lg font-serif font-bold text-on-surface text-center">
          How they work together
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="flex flex-col gap-md bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
            <BookOpen size={28} className="text-primary" aria-hidden="true" />
            <h3 className="text-headline-sm font-semibold text-on-surface">Resources</h3>
            <p className="text-body-md text-on-surface-variant flex-1">
              Exemplars and guides for every subject, free to browse without an account.
            </p>
            <Link href="/resources" className="text-primary font-semibold text-body-md hover:underline">
              Browse resources
            </Link>
          </div>

          <div className="flex flex-col gap-md bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
            <CalendarRange size={28} className="text-primary" aria-hidden="true" />
            <h3 className="text-headline-sm font-semibold text-on-surface">The Hub</h3>
            <p className="text-body-md text-on-surface-variant flex-1">
              Pick your subjects, plan your studying, and track every single deadline in one
              place — tests, uni applications, IAs, EEs, and more.
            </p>
            <Link href="/hub" className="text-primary font-semibold text-body-md hover:underline">
              Start planning
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center gap-md pt-sm">
          <p className="text-on-surface-variant text-body-md text-center max-w-140">
            Pick a deadline in the Hub and its recommended resources are already sitting right
            beside it.
          </p>
          <div className="w-full max-w-140 bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm">
            <div className="flex items-center gap-sm">
              <CheckCircle2 size={18} className="text-primary shrink-0" aria-hidden="true" />
              <span className="text-label-md font-semibold text-on-surface">
                Chemistry IA — draft due Friday
              </span>
            </div>
            <div className="flex flex-col gap-xs pl-lg">
              <span className="text-[11px] text-on-surface-variant">
                Recommended resources
              </span>
              <div className="flex flex-wrap gap-xs">
                <span className="text-label-md bg-primary-container text-on-primary-container rounded-full px-sm py-[2px]">
                  IA exemplar
                </span>
                <span className="text-label-md bg-primary-container text-on-primary-container rounded-full px-sm py-[2px]">
                  Lab write-up guide
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
