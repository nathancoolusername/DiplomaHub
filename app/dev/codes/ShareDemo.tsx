"use client";

import { useState } from "react";
import { ShareCodeDialog } from "@/components/codes/ShareCodeDialog";
import { HubSetChoice } from "@/components/codes/HubSetChoice";
import { ShareSetDialog } from "@/components/hub/share-set-dialog";
import type { HubItem } from "@/components/hub/mock-data";

const DAY = 86_400_000;

function sampleItems(): HubItem[] {
  const base = new Date();
  base.setHours(9, 0, 0, 0);
  const rows: [string, string | null, number, HubItem["type"]][] = [
    ["Revise vectors", "math_aa", 1, "study_block"],
    ["Paper 1 mock", "math_aa", 6, "ib_component"],
    ["Kinematics past papers", "physics", 3, "study_block"],
    ["Physics IA draft", "physics", 12, "ib_component"],
    ["UCAS personal statement", null, 20, "university"],
    ["Calculus flashcards", "math_aa", 40, "study_block"],
    ["Too far out", "math_aa", 90, "task"],
  ];
  return rows.map(([title, subjectId, d, type], i) => ({
    id: `itm-demo${i}`,
    title,
    type,
    subjectId: subjectId as HubItem["subjectId"],
    start: new Date(base.getTime() + d * DAY),
    end: new Date(base.getTime() + d * DAY + 3_600_000),
    allDay: false,
    status: "todo",
    stages: [],
    notes: "",
    resourceIds: [],
    hasTimer: false,
    kind: null,
    setId: null,
  }));
}

/** Opens the share dialogs and the Hub-set choice with sample data (dev only). */
export function ShareDemo() {
  const [open, setOpen] = useState<"practice_set" | "hub_item" | "picker" | null>(null);
  const [choice, setChoice] = useState<string | null>(null);
  const btn = "rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold cursor-pointer";
  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap gap-sm">
        <button type="button" onClick={() => setOpen("practice_set")} className={btn}>
          Share dialog (set)
        </button>
        <button type="button" onClick={() => setOpen("hub_item")} className={btn}>
          Share dialog (Hub item)
        </button>
        <button type="button" onClick={() => setOpen("picker")} className={btn}>
          Share a set (Hub picker)
        </button>
      </div>
      <h2 className="font-serif font-bold text-headline-md text-on-surface">Redeeming a Hub set</h2>
      <HubSetChoice
        preview={{ name: "Paper 1 revision plan", count: 14, firstStart: "2027-03-01T08:00:00Z", lastEnd: "2027-04-28T10:00:00Z" }}
        busy={false}
        error={null}
        onConfirm={(c) => setChoice(JSON.stringify(c))}
        onCancel={() => setChoice("cancelled")}
      />
      {choice && <p id="choice-out" className="font-mono text-label-md text-on-surface-variant">{choice}</p>}
      {(open === "practice_set" || open === "hub_item") && (
        <ShareCodeDialog type={open} code="K7MPX" title={open === "practice_set" ? "Vectors: mixed Paper 1" : "Physics IA draft due"} useCount={open === "practice_set" ? 12 : 0} onClose={() => setOpen(null)} />
      )}
      {open === "picker" && <ShareSetDialog items={sampleItems()} customSubjects={[]} onClose={() => setOpen(null)} />}
    </div>
  );
}
