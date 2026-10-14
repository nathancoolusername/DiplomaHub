import type { StrengthMap } from "@/lib/data/types";
import { links } from "@/lib/practice/links";
import { MIN_ANSWERED } from "@/lib/practice/strength";
import { StrengthTile } from "./StrengthTile";

/**
 * A subject's subtopic tiles grouped under topic headings. Tiles always
 * link into Build with that subtopic preselected — even before any
 * practice, when they show as dashed outlines.
 */
export function StrengthMapView({ map, size = "compact" }: { map: StrengthMap; size?: "compact" | "full" }) {
  const isEmpty = map.topics.every((t) => t.subtopics.every((s) => s.level === "none"));
  const practiceType = map.subject.supportedTypes[0] ?? "mcq_short";

  return (
    <div className="flex flex-col gap-md">
      {isEmpty && (
        <p className="text-label-md text-on-surface-variant">
          Tiles fill in as you practise; {MIN_ANSWERED} questions in a topic shows your level.
        </p>
      )}
      {/* Compact maps are landscape: topics side by side in columns. */}
      <div className={size === "compact" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-x-xl gap-y-lg" : "flex flex-col gap-md"}>
        {map.topics.map((topic) => (
          <section key={topic.code} className="flex flex-col gap-xs">
            <h4 className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wide">
              {topic.name}
            </h4>
            <div
              className={
                size === "compact"
                  ? "flex flex-wrap gap-xs"
                  : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-sm"
              }
            >
              {topic.subtopics.map((s) => (
                <StrengthTile
                  key={s.id}
                  code={s.code}
                  name={s.name}
                  shortName={s.shortName}
                  level={s.level}
                  size={size}
                  href={links.build(map.subject.id, practiceType, [s.id])}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
