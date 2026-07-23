import Link from "next/link";
import { ChevronRight } from "lucide-react";

// These labels are page-level "where am I" nav, not document headings — a
// real heading for the page follows elsewhere in the markup.
export function Breadcrumb({
  parentLabel,
  parentHref,
  currentLabel,
  currentClassName = "text-primary",
}: {
  parentLabel: string;
  parentHref: string;
  currentLabel: string | null;
  currentClassName?: string;
}) {
  return (
    <div className="flex flex-row gap-sm items-center">
      <Link href={parentHref}>
        <span className="text-on-surface-variant text-headline-md uppercase">
          {parentLabel}
        </span>
      </Link>
      <ChevronRight />
      <span className={`${currentClassName} text-headline-md uppercase`}>
        {currentLabel}
      </span>
    </div>
  );
}
