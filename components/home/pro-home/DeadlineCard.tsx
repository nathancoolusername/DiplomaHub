import Link from "next/link";
import { ChevronRight, Timer } from "lucide-react";

/** Deadline on Home: one tap to the party game. */
export function DeadlineCard() {
  return (
    <Link
      href="/play/deadline"
      className="group rounded-2xl bg-surface-container-lowest border border-outline-variant px-lg py-md flex items-center gap-md hover:border-primary"
    >
      <span className="w-10 h-10 shrink-0 rounded-xl bg-error-container text-on-error-container flex items-center justify-center" aria-hidden="true">
        <Timer size={18} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-on-surface group-hover:text-primary">Play Deadline with friends</span>
        <span className="block text-label-md text-on-surface-variant">The IB party game: name an answer before your deadline. Last one in wins.</span>
      </span>
      <ChevronRight size={18} className="text-on-surface-variant" aria-hidden="true" />
    </Link>
  );
}
