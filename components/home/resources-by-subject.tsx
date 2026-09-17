import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SubjectTags } from "../pills";
import { getResourceCountsBySubject } from "@/app/lib/actions/resources";

// One subject per real resources.subject_tag value (components/pills.tsx is
// the canonical taxonomy) — a single grouped-count query instead of one
// getResourcesPage() call per subject (see getResourceCountsBySubject).
export default async function ResourcesBySubject() {
  const subjects = Object.keys(SubjectTags);
  const result = await getResourceCountsBySubject();
  const countsBySubject = result.success ? result.data : {};

  return (
    <div className="px-md py-xl bg-surface-container-lowest">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-lg">
        <h2 className="text-headline-lg font-serif font-bold text-on-surface text-center">
          Resources by subject
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-sm">
          {subjects.map((subject) => {
            const count = countsBySubject[subject] ?? 0;
            return (
              <Link
                key={subject}
                href={`/resources?subject=${encodeURIComponent(subject)}`}
                className="flex items-center justify-between gap-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm hover:border-primary transition-colors"
              >
                <span className="flex flex-col min-w-0">
                  <span className="text-label-md font-semibold text-on-surface truncate">{subject}</span>
                  <span className="text-[11px] text-on-surface-variant">
                    {count} resource{count === 1 ? "" : "s"}
                  </span>
                </span>
                <ArrowRight size={16} className="text-outline shrink-0" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
