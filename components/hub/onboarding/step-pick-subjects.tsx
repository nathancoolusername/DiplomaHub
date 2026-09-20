import { useState, type FormEvent } from "react";
import { Check, Plus, X } from "lucide-react";
import {
  SUBJECTS,
  SUBJECT_GROUP_LABELS,
  type CustomSubject,
  type Subject,
  type SubjectGroup,
  type SubjectId,
} from "../mock-data";
import { getSubjectColor } from "../subject-colors";
import { MAX_SUBJECTS, CORE_SUBJECT_IDS, countNonCore, isCoreSubject } from "./subject-cap";

const GROUPS: SubjectGroup[] = ["math", "language", "social_sciences", "science", "arts"];
const CORE_SUBJECTS = SUBJECTS.filter((s) => CORE_SUBJECT_IDS.includes(s.id));

function SubjectPill({
  subject,
  active,
  disabled,
  onToggle,
}: {
  subject: Pick<Subject, "id" | "name">;
  active: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const color = getSubjectColor(subject.id);
  const core = isCoreSubject(subject.id);
  return (
    <button
      type="button"
      onClick={onToggle}
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
}

export default function StepPickSubjects({
  selected,
  onToggle,
  customSubjects,
  onAddCustom,
  onRemoveCustom,
}: {
  selected: Set<SubjectId>;
  onToggle: (id: SubjectId) => void;
  customSubjects: CustomSubject[];
  onAddCustom: (name: string) => void;
  onRemoveCustom: (id: string) => void;
}) {
  const [customName, setCustomName] = useState("");
  const nonCoreCount = countNonCore(selected);
  const atCap = nonCoreCount >= MAX_SUBJECTS;

  function handleAddCustom(e: FormEvent) {
    e.preventDefault();
    const trimmed = customName.trim();
    if (!trimmed || atCap) return;
    onAddCustom(trimmed);
    setCustomName("");
  }

  return (
    <div className="flex flex-col gap-lg">
      <div>
        <h2 className="text-headline-md font-serif font-bold text-on-surface">Pick your subjects</h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Choose the {MAX_SUBJECTS} subjects you&apos;re taking — TOK, EE, CAS, and General are already
          included for everyone. Don&apos;t see one? Add your own at the bottom. This sets your default
          calendar filter; you can change it anytime from the Hub.
        </p>
      </div>

      {GROUPS.map((group) => {
        const groupSubjects = SUBJECTS.filter((s) => s.group === group);
        if (groupSubjects.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-sm">
            <span className="text-label-sm font-semibold text-on-surface-variant">
              {SUBJECT_GROUP_LABELS[group]}
            </span>
            <div className="flex flex-wrap gap-sm">
              {groupSubjects.map((subject) => (
                <SubjectPill
                  key={subject.id}
                  subject={subject}
                  active={selected.has(subject.id)}
                  disabled={!selected.has(subject.id) && atCap}
                  onToggle={() => onToggle(subject.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex flex-col gap-sm">
        <span className="text-label-sm font-semibold text-on-surface-variant">Core (always included)</span>
        <div className="flex flex-wrap gap-sm">
          {CORE_SUBJECTS.map((subject) => (
            <SubjectPill
              key={subject.id}
              subject={subject}
              active={selected.has(subject.id)}
              disabled={false}
              onToggle={() => onToggle(subject.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-sm pt-sm border-t border-outline-variant/50">
        <span className="text-label-sm font-semibold text-on-surface-variant">Your subjects</span>
        {customSubjects.length > 0 && (
          <div className="flex flex-wrap gap-sm">
            {customSubjects.map((subject) => {
              const color = getSubjectColor(subject.id);
              return (
                <span
                  key={subject.id}
                  className="inline-flex items-center gap-1.5 pl-md pr-1.5 py-2 rounded-full text-label-md font-semibold"
                  style={{ backgroundColor: color.base, color: color.onBase }}
                >
                  {subject.name}
                  <button
                    type="button"
                    onClick={() => onRemoveCustom(subject.id)}
                    aria-label={`Remove ${subject.name}`}
                    className="p-0.5 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <form onSubmit={handleAddCustom} className="flex gap-sm">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Add your own, e.g. Latin"
            disabled={atCap}
            maxLength={40}
            className="flex-1 min-w-0 bg-surface-container-low border border-outline-variant rounded-lg px-sm py-2 text-body-md text-on-surface disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={atCap || !customName.trim()}
            className="shrink-0 inline-flex items-center gap-1 px-md py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Add
          </button>
        </form>
        {/* Custom subjects have no matching resource content yet, so unlike
            the built-in list above, nothing here ever populates "Recommended
            Resources" for a task tagged with one of these. */}
        <p className="text-[11px] text-on-surface-variant">
          Custom subjects won&apos;t show recommended resources, since there&apos;s no matching content
          for them yet.
        </p>
      </div>

      <p className="text-label-sm text-on-surface-variant">
        {nonCoreCount} of {MAX_SUBJECTS} subjects selected
        {atCap ? " — unselect one to pick a different subject." : "."}
      </p>
    </div>
  );
}
