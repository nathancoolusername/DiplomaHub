import Link from "next/link";
import { ChevronRight, FileCheck2 } from "lucide-react";

/** Coursework review on Home: IA, EE and TOK drafts marked against the criteria. */
export function ReviewCard({ isPro }: { isPro: boolean }) {
  return (
    <Link
      href={isPro ? "/review" : "/pro"}
      className="group rounded-2xl bg-surface-container-lowest border border-outline-variant px-lg py-md flex items-center gap-md hover:border-primary"
    >
      <span className="w-10 h-10 shrink-0 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center" aria-hidden="true">
        <FileCheck2 size={18} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-on-surface group-hover:text-primary">
          Review your IA, EE or TOK
          {!isPro && <span className="ml-xs rounded-full bg-surface-container px-sm py-0.5 text-label-sm font-semibold text-on-surface-variant align-middle">DiplomaPro</span>}
        </span>
        <span className="block text-label-md text-on-surface-variant">Upload a draft and get it marked against the official criteria, with comments on your pages.</span>
      </span>
      <ChevronRight size={18} className="text-on-surface-variant" aria-hidden="true" />
    </Link>
  );
}
