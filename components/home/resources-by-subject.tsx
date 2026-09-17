import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SubjectTags } from "../pills";
import { getResourcesPage } from "@/app/lib/actions/resources";

// One subject per real resources.subject_tag value (components/pills.tsx is
// the canonical taxonomy) — pageSize: 1 keeps each query cheap while still
// getting an exact totalCount, the same parallel-fan-out shape already
// proven by getHubRecommendedResources in app/lib/actions/hub.ts.
export default async function ResourcesBySubject() {
  const subjects = Object.keys(SubjectTags);

  const counts = await Promise.all(
    subjects.map(async (subject) => {
      const result = await getResourcesPage({ subject, pageSize: 1 });
      return { subject, count: result.success ? result.data.totalCount : 0 };
    }),
  );

  return (
    <div className="px-md py-xl bg-surface-container-lowest">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-lg">
        <h2 className="text-headline-lg font-serif font-bold text-on-surface text-center">
          Resources by subject
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-sm">
          {counts.map(({ subject, count }) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
