import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { StrengthMap, UserSubject } from "@/lib/data/types";
import { RequestSubjectButton } from "@/components/practice/RequestSubjectButton";
import { SetLevel } from "@/components/practice/SetLevel";
import { links } from "@/lib/practice/links";
import { STRENGTH_LABELS, levelFor, MIN_ANSWERED } from "@/lib/practice/strength";

/**
 * A subject on the Practice page: name, HL/SL, overall strength bar and up
 * to two weak topics. Before any practice it says so and offers a start.
 * Subjects the student typed themselves are tagged "Your subject"; a subject
 * from the Hub with no HL/SL yet asks for it instead of guessing.
 */
export function SubjectCard({
  us,
  map,
  compact = false,
  hasPractice = true,
  requested = false,
}: {
  us: UserSubject;
  map: StrengthMap | null;
  compact?: boolean;
  /** False when no questions have been added for this subject yet. */
  hasPractice?: boolean;
  /** The student has already requested this subject. */
  requested?: boolean;
}) {
  const overall = map?.overall ?? null;
  const level = overall === null ? "none" : levelFor(overall, MIN_ANSWERED);
  const weak = (map?.weakest ?? []).slice(0, 2);
  const practiceType = us.subject.supportedTypes[0] ?? "mcq_short";
  const custom = us.subject.id.startsWith("custom:");

  return (
    <article
      className={`group relative rounded-2xl bg-surface-container-lowest border border-outline-variant flex flex-col gap-sm hover:border-primary transition-colors ${
        compact ? "p-md" : "p-lg min-h-40"
      }`}
    >
      <header className="flex items-start justify-between gap-sm">
        <h3 className={`font-serif font-bold text-on-surface leading-snug ${compact ? "text-body-md" : "text-body-lg"}`}>
          {/* Stretched link: the whole card opens the subject page. */}
          <Link href={links.subject(us.subject.id)} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
            {compact ? us.subject.shortName : us.subject.name}
          </Link>
        </h3>
        {us.levelSet ? (
          <span className="shrink-0 rounded-full bg-primary text-on-primary px-sm py-px text-label-sm font-bold">{us.level}</span>
        ) : (
          // Above the card's stretched link so it can be clicked.
          <SetLevel subjectId={us.subject.id} className="relative z-10" />
        )}
      </header>
      {custom && (
        <span className="self-start -mt-xs rounded-full bg-surface-container text-on-surface-variant px-sm py-px text-label-sm font-semibold">Your subject</span>
      )}

      {us.subject.supportedTypes.length === 0 || !hasPractice ? (
        <div className="mt-auto flex flex-col items-start gap-xs">
          <p className="inline-flex items-center gap-xs text-label-md text-on-surface-variant">
            <Clock size={14} aria-hidden="true" /> Practice coming soon
          </p>
          {/* Above the card's stretched link so it can be clicked. */}
          <RequestSubjectButton subjectId={us.subject.id} level={us.level} requested={requested} className="relative z-10" />
        </div>
      ) : overall === null ? (
        <div className="mt-auto flex items-center justify-between gap-sm">
          <p className="text-label-md text-on-surface-variant">Not started yet</p>
          {!compact && (
            <Link
              href={links.build(us.subject.id, practiceType)}
              className="relative z-10 inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90"
            >
              Start <ArrowRight size={14} aria-hidden="true" />
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-auto flex flex-col gap-xs">
          <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
            <span>Strength</span>
            <span className="font-semibold text-on-surface">{STRENGTH_LABELS[level]}</span>
          </div>
          <div
            className="h-2 rounded-full bg-surface-container overflow-hidden"
            role="meter"
            aria-label={`${us.subject.shortName} strength`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(overall * 100)}
            aria-valuetext={STRENGTH_LABELS[level]}
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(overall * 100)}%` }} />
          </div>
          {!compact && weak.length > 0 && (
            <p className="text-label-md text-on-surface-variant line-clamp-2">
              <span className="font-semibold text-on-surface">Weak:</span> {weak.map((w) => w.shortName).join(", ")}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
