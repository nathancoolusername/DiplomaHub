"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { makeCustomSubjectId, type CustomSubject, type SubjectId } from "../mock-data";
import StepPickSubjects from "./step-pick-subjects";
import { toggleWithCap, countNonCore, MAX_SUBJECTS } from "./subject-cap";

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export default function EditSubjectsDialog({
  initialSelected,
  initialCustomSubjects,
  onSave,
  onClose,
}: {
  initialSelected: Set<SubjectId>;
  initialCustomSubjects: CustomSubject[];
  onSave: (subjectIds: SubjectId[] | null, customSubjects: CustomSubject[]) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Set<SubjectId>>(() => new Set(initialSelected));
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>(initialCustomSubjects);

  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null;
    getFocusable(dialogRef.current)[0]?.focus();
    return () => prevActive?.focus?.();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable(dialogRef.current);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function toggleSubject(id: SubjectId) {
    setSelected((prev) => toggleWithCap(prev, id));
  }

  function addCustomSubject(name: string) {
    if (countNonCore(selected) >= MAX_SUBJECTS) return;
    const id = makeCustomSubjectId();
    setCustomSubjects((prev) => [...prev, { id, name }]);
    setSelected((prev) => new Set([...prev, id]));
  }

  function removeCustomSubject(id: string) {
    setCustomSubjects((prev) => prev.filter((s) => s.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleSave() {
    onSave(selected.size > 0 ? Array.from(selected) : null, customSubjects);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center p-md">
      <div className="absolute inset-0 bg-on-surface/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-subjects-title"
        className="relative bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl w-full max-w-140 max-h-[90vh] overflow-y-auto p-lg flex flex-col gap-lg"
      >
        <div className="flex items-center justify-between">
          <span id="edit-subjects-title" className="sr-only">
            Edit your subjects
          </span>
          <div />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-sm rounded-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <StepPickSubjects
          selected={selected}
          onToggle={toggleSubject}
          customSubjects={customSubjects}
          onAddCustom={addCustomSubject}
          onRemoveCustom={removeCustomSubject}
        />

        <div className="flex justify-end gap-sm pt-sm border-t border-outline-variant/50">
          <button
            type="button"
            onClick={onClose}
            className="px-md py-2 rounded-lg border border-outline-variant text-label-md font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-md py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
