"use client";

import Link from "next/link";
import { useState } from "react";
import { Camera, Clock, FileText, ListChecks, PenLine } from "lucide-react";
import type { Level, PracticeType, Subject } from "@/lib/data/types";
import { links } from "@/lib/practice/links";
import { PRACTICE_TYPES, PRACTICE_TYPE_ORDER } from "@/lib/practice/practice-types";
import { RequestSubjectButton } from "@/components/practice/RequestSubjectButton";
import { ProBadge, UpgradePopover } from "@/components/shared/ProUpsell";

const ICONS: Record<PracticeType, React.ReactNode> = {
  mcq_short: <ListChecks size={22} />,
  essay: <PenLine size={22} />,
  mock: <FileText size={22} />,
  grade_own: <Camera size={22} />,
};

const box =
  "relative h-full w-full rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-sm text-left hover:border-primary transition-colors";

/**
 * The practice types this subject supports (Maths has no essays, Lang A
 * no MCQs), so no box ever leads to an empty page.
 */
export function PracticeBoxes({
  subject,
  level,
  isPro,
  hasPractice = true,
  requested = false,
}: {
  subject: Subject;
  level: Level;
  isPro: boolean;
  hasPractice?: boolean;
  /** The student has already asked for this subject. */
  requested?: boolean;
}) {
  const [upsell, setUpsell] = useState<PracticeType | null>(null);
  const types = PRACTICE_TYPE_ORDER.filter((t) => subject.supportedTypes.includes(t));
  if (types.length === 0 || !hasPractice) {
    return (
      <div className="rounded-2xl bg-surface-container-lowest border border-dashed border-outline-variant p-lg text-body-md text-on-surface-variant flex flex-col items-start gap-md">
        <p>
          <span className="inline-flex items-center gap-xs font-semibold text-on-surface">
            <Clock size={16} aria-hidden="true" /> Practice for {subject.shortName} is coming soon
          </span>
          <br />
          There are no practice questions for this subject yet, so there&apos;s nothing to build a set from. It still counts as one of your
          subjects: your Hub, deadlines and countdowns work as normal, and practice appears here when questions are added.
        </p>
        <RequestSubjectButton subjectId={subject.id} level={level} requested={requested} />
      </div>
    );
  }

  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-md">
      {types.map((type) => {
        const meta = PRACTICE_TYPES[type];
        const locked = meta.pro && !isPro;
        const content = (
          <>
            <span className="w-11 h-11 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center" aria-hidden="true">
              {ICONS[type]}
            </span>
            <span className="flex items-center gap-xs font-serif font-bold text-body-lg text-on-surface">
              {meta.title}
              {meta.pro && <ProBadge />}
            </span>
            <span className="text-label-md text-on-surface-variant">{meta.description}</span>
          </>
        );
        return (
          <li key={type} className="relative">
            {locked ? (
              <button type="button" onClick={() => setUpsell(type)} className={`${box} cursor-pointer`}>
                {content}
              </button>
            ) : (
              <Link href={links.build(subject.id, type)} className={box}>
                {content}
              </Link>
            )}
            {upsell === type && (
              <UpgradePopover feature={meta.title} onClose={() => setUpsell(null)} className="absolute left-md top-full mt-xs" />
            )}
          </li>
        );
      })}
    </ul>
  );
}
