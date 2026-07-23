"use client";

import { useState } from "react";
import { updateRoadmapItem } from "@/app/lib/actions/admin";
import type { RoadmapItem, RoadmapStatus } from "@/app/lib/types";

const STATUS_OPTIONS: { value: RoadmapStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function RoadmapTable({ items }: { items: RoadmapItem[] }) {
  return (
    <div className="overflow-x-auto bg-surface-container-lowest border-1 border-outline-variant rounded-xl">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b-1 border-outline-variant text-on-surface-variant text-label-md uppercase">
            <th className="p-md">Milestone</th>
            <th className="p-md">Status</th>
            <th className="p-md">Completion</th>
            <th className="p-md"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <RoadmapRow key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoadmapRow({ item }: { item: RoadmapItem }) {
  const [status, setStatus] = useState(item.status);
  const [percentage, setPercentage] = useState(item.completion_percentage ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    status !== item.status ||
    (status === "in_progress" && percentage !== (item.completion_percentage ?? 0));

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateRoadmapItem(
      item.id,
      status,
      status === "in_progress" ? percentage : null,
    );
    if (!result.success) setError(result.error);
    setSaving(false);
  }

  return (
    <tr className="border-b-1 border-outline-variant last:border-b-0 align-top">
      <td className="p-md font-bold text-body-md">{item.title}</td>
      <td className="p-md">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as RoadmapStatus)}
          className="border rounded-lg px-sm py-1"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </td>
      <td className="p-md">
        {status === "in_progress" ? (
          <div className="flex flex-row items-center gap-sm">
            <input
              type="number"
              min={0}
              max={100}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-20 border rounded-lg px-sm py-1"
            />
            <p className="text-on-surface-variant">%</p>
          </div>
        ) : (
          <p className="text-on-surface-variant text-label-md">—</p>
        )}
      </td>
      <td className="p-md">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="text-primary font-semibold disabled:opacity-40 cursor-pointer"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {error && <p className="text-red-500 text-label-sm mt-xs">{error}</p>}
      </td>
    </tr>
  );
}
