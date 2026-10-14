"use client";

import { useState } from "react";
import { DiplomaBroIcon, type DiplomaBroState } from "@/components/shared/bro/DiplomaBroIcon";
import { Segmented } from "@/components/shared/Segmented";

const STATES: DiplomaBroState[] = ["idle", "thinking", "answering", "done", "notification", "locked"];

/** Switch one icon between states to see the transitions (e.g. the gap closing on "done"). */
export function Playground() {
  const [state, setState] = useState<DiplomaBroState>("idle");
  return (
    <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-wrap items-center gap-lg">
      <DiplomaBroIcon state={state} size={96} onClick={() => setState(STATES[(STATES.indexOf(state) + 1) % STATES.length])} />
      <div className="flex flex-col gap-xs">
        <span className="text-label-md font-semibold text-on-surface">Live state (or click the icon)</span>
        <Segmented label="State" value={state} onChange={setState} options={STATES.map((s) => ({ value: s, label: s }))} size="sm" />
      </div>
    </div>
  );
}
