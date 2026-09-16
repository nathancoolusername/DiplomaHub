import { Check } from "lucide-react";
import { SUBJECTS, type SubjectId } from "../mock-data";
import { getSubjectColor } from "../subject-colors";
import { MAX_SUBJECTS, countNonCore, isCoreSubject } from "./subject-cap";

export default function StepPickSubjects({
  selected,
  onToggle,
}: {
  selected: Set<SubjectId>;
  onToggle: (id: SubjectId) => void;
}) {
  const nonCoreCount = countNonCore(selected);
  const atCap = nonCoreCount >= MAX_SUBJECTS;

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h2 className="text-headline-md font-serif font-bold text-on-surface">Pick your subjects</h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Choose the {MAX_SUBJECTS} subjects you&apos;re taking — TOK, EE, CAS, and General are already
          included for everyone. This sets your default calendar filter; you can change it anytime from
          the Hub.
        </p>
      </div>
      <div className="flex flex-wrap gap-sm">
        {SUBJECTS.map((subject) => {
          const color = getSubjectColor(subject.id);
          const active = selected.has(subject.id);
          const core = isCoreSubject(subject.id);
          const disabled = !core && !active && atCap;
          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => onToggle(subject.id)}
              disabled={disabled}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 px-md py-2 rounded-full border text-label-md font-semibold transition-colors ${
                disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              }`}
              style={
                active
                  ? { backgroundColor: color.base, borderColor: color.base, color: color.onBase }
                  : { borderColor: "var(--color-outline-variant)", color: "var(--color-on-surface-variant)" }
              }
            >
              {active && <Check size={14} />}
              {subject.name}
              {core && !active && <span className="text-[10px] opacity-70">(core)</span>}
            </button>
          );
        })}
      </div>
      <p className="text-label-sm text-on-surface-variant">
        {nonCoreCount} of {MAX_SUBJECTS} subjects selected
        {atCap ? " — unselect one to pick a different subject." : "."}
      </p>
    </div>
  );
}
