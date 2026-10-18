import Link from "next/link";
import { CalendarDays, Library, UserPen } from "lucide-react";
import type { CalendarItem, Subject } from "@/lib/data/types";

const KIND_LABEL: Record<CalendarItem["kind"], string> = { deadline: "Deadline", test: "Test", mock: "Mock", study: "Study" };

/**
 * The side panel for a subject with nothing of ours behind it (a subject the
 * student typed in, or one with no questions yet): what DiplomaHub does for
 * it, and the student's own upcoming Hub items for it, instead of an empty
 * syllabus box.
 */
export function CustomSubjectInfo({ subject, custom, items }: { subject: Subject; custom: boolean; items: CalendarItem[] }) {
  return (
    <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant px-lg py-md flex flex-col gap-md" aria-label="About this subject">
      {custom && (
        <p className="flex gap-sm text-label-md text-on-surface-variant">
          <UserPen size={16} className="shrink-0 mt-px text-primary" aria-hidden="true" />
          <span>
            <span className="font-semibold text-on-surface">Your subject.</span> You added {subject.name} yourself, so there&apos;s no syllabus or question bank for
            it here. It still counts as one of your subjects in the Hub, with its deadlines and countdowns.
          </span>
        </p>
      )}

      <div className="flex flex-col gap-xs">
        <h2 className="font-serif font-bold text-body-lg text-on-surface flex items-center gap-xs">
          <CalendarDays size={16} className="text-primary" aria-hidden="true" /> Coming up
        </h2>
        {items.length === 0 ? (
          <p className="text-label-md text-on-surface-variant">Nothing in your Hub for {subject.shortName} yet.</p>
        ) : (
          <ul className="flex flex-col">
            {items.map((i) => (
              <li key={i.id} className="flex items-baseline justify-between gap-md py-xs border-t border-outline-variant first:border-t-0 text-label-md">
                <span className="text-on-surface truncate">
                  <span className="text-on-surface-variant">{KIND_LABEL[i.kind]} · </span>
                  {i.title}
                </span>
                <time dateTime={i.startsAt} className="shrink-0 tabular-nums text-on-surface-variant">
                  {new Date(i.startsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
                </time>
              </li>
            ))}
          </ul>
        )}
        <Link href="/hub" className="self-start text-label-md font-semibold text-primary hover:underline">
          {items.length === 0 ? "Add a deadline or test in the Hub" : "Open the Hub"}
        </Link>
      </div>

      {subject.resourceTag && (
        <Link
          href={`/resources?subject=${encodeURIComponent(subject.resourceTag)}`}
          className="flex items-center gap-sm text-body-md font-semibold text-on-surface hover:text-primary border-t border-outline-variant pt-sm"
        >
          <Library size={16} className="text-primary" aria-hidden="true" /> {subject.shortName} resources
        </Link>
      )}
    </section>
  );
}
