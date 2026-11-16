import Link from "next/link";
import { Ticket } from "lucide-react";
import { links } from "@/lib/practice/links";

/** The way to /codes from Practice and the Hub: redeem a code, see the ones you've shared. */
export function CodesLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href={links.codes()}
      className={`inline-flex items-center gap-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface px-md py-2 text-label-md font-semibold transition-colors ${className}`}
    >
      <Ticket size={16} aria-hidden="true" />
      Codes
    </Link>
  );
}
