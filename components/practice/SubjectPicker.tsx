"use client";

import { useState, type FormEvent } from "react";
import { Check, Plus, X } from "lucide-react";
import type { Level, Subject, SubjectId } from "@/lib/data/types";
import { makeCustomSubjectId } from "@/components/hub/mock-data";
import { getSubjectColor } from "@/components/hub/subject-colors";
import { Segmented } from "@/components/shared/Segmented";

// The Hub's subject picker (same subject-coloured pills and "Add your own"),
// for DiplomaPro's subjects, grouped by IB group so Language A (Literature or
// Language & Literature) and Language B can't be mixed up. Picks are capped
// and each gets HL or SL. TOK, EE and CAS aren't listed: everyone has them.
// Custom subjects use the Hub's "custom:xxxx" ids.

const IB_GROUPS: { group: number; label: string }[] = [
  { group: 1, label: "Group 1 · Language A (studies in language and literature)" },
  { group: 2, label: "Group 2 · Language B (language acquisition)" },
  { group: 3, label: "Group 3 · Individuals and societies" },
  { group: 4, label: "Group 4 · Sciences" },
  { group: 5, label: "Group 5 · Mathematics" },
  { group: 6, label: "Group 6 · The arts" },
];

/** `name` is set only for subjects the student typed themselves. */
export type SubjectPick = { subjectId: SubjectId; level: Level; name?: string };

function Pill({
  id,
  name,
  active,
  disabled,
  noPractice = false,
  onToggle,
}: {
  id: string;
  name: string;
  active: boolean;
  disabled: boolean;
  /** No practice questions for this subject yet: marked with a dot, explained under the pills. */
  noPractice?: boolean;
  onToggle: () => void;
}) {
  const color = getSubjectColor(id);
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
      {name}
      {noPractice && <span className="w-1.5 h-1.5 rounded-[50%] bg-current opacity-50" title="No questions yet" aria-label="(no questions yet)" />}
    </button>
  );
}

/**
 * `max` subjects to pick (6 for the diploma, 1 for an extra class). With
 * `levels`, each pick gets an HL/SL toggle underneath.
 */
export function SubjectPicker({
  catalog,
  value,
  onChange,
  max,
  exclude = [],
  levels = true,
  practiceIds = null,
}: {
  catalog: Subject[];
  value: SubjectPick[];
  onChange: (next: SubjectPick[]) => void;
  max: number;
  /** Subjects that can't be picked here (e.g. already taken). */
  exclude?: SubjectId[];
  levels?: boolean;
  /** Subjects that have practice questions (null = unknown: show no marks). */
  practiceIds?: string[] | null;
}) {
  const [customName, setCustomName] = useState("");
  const picked = new Set(value.map((v) => v.subjectId));
  const atCap = value.length >= max;
  const customs = value.filter((v) => v.name);
  const nameOf = (id: string) => value.find((v) => v.subjectId === id)?.name ?? catalog.find((s) => s.id === id)?.name ?? id;

  const addCustom = (e: FormEvent) => {
    e.preventDefault();
    const name = customName.trim().slice(0, 40);
    if (!name || (atCap && max !== 1)) return;
    const pick = { subjectId: makeCustomSubjectId(), level: "SL" as Level, name };
    onChange(max === 1 ? [pick] : [...value, pick]);
    setCustomName("");
  };

  const toggle = (id: SubjectId) => {
    if (picked.has(id)) onChange(value.filter((v) => v.subjectId !== id));
    else if (max === 1) onChange([{ subjectId: id, level: value[0]?.level ?? "SL" }]);
    else if (!atCap) onChange([...value, { subjectId: id, level: "SL" }]);
  };

  return (
    <div className="flex flex-col gap-lg">
      {IB_GROUPS.map(({ group, label }) => {
        const subjects = catalog.filter((s) => s.ibGroup === group && !exclude.includes(s.id));
        if (subjects.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-sm">
            <span className="text-label-sm font-semibold text-on-surface-variant">{label}</span>
            <div className="flex flex-wrap gap-sm">
              {subjects.map((s) => (
                <Pill
                  key={s.id}
                  id={s.id}
                  name={s.name}
                  active={picked.has(s.id)}
                  disabled={!picked.has(s.id) && atCap && max !== 1}
                  noPractice={!!practiceIds && !practiceIds.includes(s.id)}
                  onToggle={() => toggle(s.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {practiceIds && catalog.some((s) => !practiceIds.includes(s.id)) && (
        <p className="flex items-center gap-xs text-label-sm text-on-surface-variant">
          <span className="w-1.5 h-1.5 rounded-[50%] bg-current opacity-50 shrink-0" aria-hidden="true" />
          No practice questions for this subject yet. You can still pick it for your Hub and countdowns, and practice appears when questions are added.
        </p>
      )}

      {/* Your own subjects, as in the Hub */}
      <div className="flex flex-col gap-sm pt-sm border-t border-outline-variant/50">
        <span className="text-label-sm font-semibold text-on-surface-variant">Your subjects</span>
        {customs.length > 0 && (
          <div className="flex flex-wrap gap-sm">
            {customs.map((c) => {
              const color = getSubjectColor(c.subjectId);
              return (
                <span
                  key={c.subjectId}
                  className="inline-flex items-center gap-1.5 pl-md pr-1.5 py-2 rounded-full text-label-md font-semibold"
                  style={{ backgroundColor: color.base, color: color.onBase }}
                >
                  {c.name}
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((v) => v.subjectId !== c.subjectId))}
                    aria-label={`Remove ${c.name}`}
                    className="p-0.5 rounded-[50%] hover:bg-current/15 transition-colors cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <form onSubmit={addCustom} className="flex gap-sm">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Add your own, e.g. Latin"
            disabled={atCap && max !== 1}
            maxLength={40}
            aria-label="Add your own subject"
            className="flex-1 min-w-0 bg-surface-container-low border border-outline-variant rounded-lg px-sm py-2 text-body-md text-on-surface disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={(atCap && max !== 1) || !customName.trim()}
            className="shrink-0 inline-flex items-center gap-1 px-md py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Add
          </button>
        </form>
        <p className="text-[11px] text-on-surface-variant">Your own subjects count towards your six but have no practice questions yet.</p>
      </div>

      {levels && value.length > 0 && (
        <div className="flex flex-col gap-xs pt-sm border-t border-outline-variant/50">
          <span className="text-label-sm font-semibold text-on-surface-variant">Level</span>
          <ul className="flex flex-col gap-xs">
            {value.map((v) => {
              const color = getSubjectColor(v.subjectId);
              return (
                <li key={v.subjectId} className="flex items-center justify-between gap-sm">
                  <span className="flex items-center gap-sm text-body-md text-on-surface">
                    <span className="w-2.5 h-2.5 rounded-[50%] shrink-0" style={{ backgroundColor: color.base }} aria-hidden="true" />
                    {nameOf(v.subjectId)}
                  </span>
                  <Segmented
                    label={`Level for ${nameOf(v.subjectId)}`}
                    size="sm"
                    value={v.level}
                    onChange={(level) => onChange(value.map((x) => (x.subjectId === v.subjectId ? { ...x, level } : x)))}
                    options={[
                      { value: "HL", label: "HL" },
                      { value: "SL", label: "SL" },
                    ]}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {max > 1 && (
        <p className="text-label-sm text-on-surface-variant">
          {value.length} of {max} subjects selected
          {atCap ? " — unselect one to pick a different subject." : "."} TOK, EE and CAS are included for everyone.
        </p>
      )}
    </div>
  );
}
