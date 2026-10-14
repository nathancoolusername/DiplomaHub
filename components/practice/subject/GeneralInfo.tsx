import Link from "next/link";
import { BookOpen, ChevronDown, ClipboardList, Library } from "lucide-react";
import type { Level, Subject, Topic } from "@/lib/data/types";

// Everything here is DiplomaHub's own summary. Official subject guides
// aren't hosted: students get those from their school.

function Row({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-outline-variant first:border-t-0">
      <summary className="flex items-center gap-sm py-sm cursor-pointer list-none text-body-md font-semibold text-on-surface hover:text-primary [&::-webkit-details-marker]:hidden">
        <span className="text-primary" aria-hidden="true">
          {icon}
        </span>
        <span className="flex-1">{title}</span>
        <ChevronDown size={16} className="text-on-surface-variant transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-md pl-7">{children}</div>
    </details>
  );
}

export function GeneralInfo({ subject, level, topics }: { subject: Subject; level: Level; topics: Topic[] }) {
  const papers = subject.papers.filter((p) => p.duration[level] !== undefined);
  const visibleTopics = topics.map((t) => ({
    ...t,
    subtopics: t.subtopics.filter((s) => level === "HL" || !s.hlOnly),
  }));

  return (
    <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant px-lg py-sm" aria-label="General info">
      <h2 className="font-serif font-bold text-body-lg text-on-surface pt-sm pb-xs">General info</h2>

      {visibleTopics.length > 0 && (
        <Row icon={<BookOpen size={16} />} title="Syllabus overview">
          <ul className="flex flex-col gap-xs text-label-md text-on-surface-variant">
            {visibleTopics.map((t) => (
              <li key={t.code} className="flex justify-between gap-md">
                <span className="text-on-surface">{t.name}</span>
                <span className="tabular-nums shrink-0">
                  {t.subtopics.length} {t.subtopics.length === 1 ? "topic" : "topics"}
                </span>
              </li>
            ))}
          </ul>
        </Row>
      )}

      {papers.length > 0 && (
        <Row icon={<ClipboardList size={16} />} title="Assessment structure">
          <table className="w-full text-label-md">
            <thead className="text-on-surface-variant text-left">
              <tr>
                <th className="font-medium pb-xs">Paper</th>
                <th className="font-medium pb-xs">Time</th>
                <th className="font-medium pb-xs">Marks</th>
                <th className="font-medium pb-xs">Calculator</th>
              </tr>
            </thead>
            <tbody className="text-on-surface tabular-nums">
              {papers.map((p) => (
                <tr key={p.code} className="border-t border-outline-variant">
                  <td className="py-xs font-semibold">Paper {p.code.slice(1)}</td>
                  <td className="py-xs">{p.duration[level]} min</td>
                  <td className="py-xs">{p.totalMarks[level]}</td>
                  <td className="py-xs">{p.calculator ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-xs text-label-sm text-on-surface-variant">{level} papers. Internal assessment not included.</p>
        </Row>
      )}

      <div className="flex items-center gap-sm py-sm border-t border-outline-variant">
        <Library size={16} className="text-primary" aria-hidden="true" />
        {subject.resourceTag ? (
          <Link
            href={`/resources?subject=${encodeURIComponent(subject.resourceTag)}`}
            className="text-body-md font-semibold text-on-surface hover:text-primary"
          >
            {subject.shortName} resources
          </Link>
        ) : (
          <span className="text-body-md text-on-surface-variant">No {subject.shortName} resources yet</span>
        )}
      </div>
    </section>
  );
}
