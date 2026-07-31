"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  createRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
  type RoadmapItemInput,
} from "@/app/lib/actions/admin";
import { ROADMAP_TAG_ICON_NAMES } from "@/components/roadmap/icons";
import type { RoadmapItem, RoadmapStatus } from "@/app/lib/types";

const STATUS_OPTIONS: { value: RoadmapStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

function toInput(item: RoadmapItem): RoadmapItemInput {
  return {
    title: item.title,
    status: item.status,
    completion_percentage: item.completion_percentage,
    release_label: item.release_label ?? "",
    description: item.description ?? "",
    tags: item.tags,
    sort_order: item.sort_order,
  };
}

function RoadmapItemFields({
  value,
  onChange,
}: {
  value: RoadmapItemInput;
  onChange: (next: RoadmapItemInput) => void;
}) {
  function set<K extends keyof RoadmapItemInput>(
    key: K,
    v: RoadmapItemInput[K],
  ) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="flex flex-col gap-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
        <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
          Title
          <input
            value={value.title}
            onChange={(e) => set("title", e.target.value)}
            className="border rounded-lg px-sm py-1 text-body-md text-on-surface"
          />
        </label>
        <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
          Release Label (date)
          <input
            value={value.release_label ?? ""}
            onChange={(e) => set("release_label", e.target.value)}
            placeholder="e.g. Estimated Jan 2027"
            className="border rounded-lg px-sm py-1 text-body-md text-on-surface"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
        Description
        <textarea
          value={value.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="border rounded-lg px-sm py-1 text-body-md text-on-surface"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
        <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
          Status
          <select
            value={value.status}
            onChange={(e) => set("status", e.target.value as RoadmapStatus)}
            className="border rounded-lg px-sm py-1"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        {value.status === "in_progress" && (
          <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
            Completion %
            <input
              type="number"
              min={0}
              max={100}
              value={value.completion_percentage ?? 0}
              onChange={(e) =>
                set("completion_percentage", Number(e.target.value))
              }
              className="border rounded-lg px-sm py-1"
            />
          </label>
        )}
        <label className="flex flex-col gap-1 text-label-md text-on-surface-variant">
          Sort Order
          <input
            type="number"
            value={value.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value))}
            className="border rounded-lg px-sm py-1"
          />
        </label>
      </div>

      <div className="flex flex-col gap-sm">
        <p className="text-label-md text-on-surface-variant">Tags</p>
        {value.tags.map((tag, i) => (
          <div key={i} className="flex flex-row items-center gap-sm">
            <input
              value={tag.label}
              onChange={(e) => {
                const tags = [...value.tags];
                tags[i] = { ...tags[i], label: e.target.value };
                set("tags", tags);
              }}
              placeholder="Tag label"
              className="border rounded-lg px-sm py-1 flex-1"
            />
            <select
              value={tag.icon}
              onChange={(e) => {
                const tags = [...value.tags];
                tags[i] = { ...tags[i], icon: e.target.value };
                set("tags", tags);
              }}
              className="border rounded-lg px-sm py-1"
            >
              {ROADMAP_TAG_ICON_NAMES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                set(
                  "tags",
                  value.tags.filter((_, idx) => idx !== i),
                )
              }
              className="text-red-500 cursor-pointer"
              aria-label="Remove tag"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            set("tags", [
              ...value.tags,
              { label: "", icon: ROADMAP_TAG_ICON_NAMES[0] },
            ])
          }
          disabled={value.tags.length >= 10}
          className="self-start text-primary text-label-md font-semibold cursor-pointer disabled:opacity-40"
        >
          + Add tag
        </button>
      </div>
    </div>
  );
}

function RoadmapRow({
  item,
  onDeleted,
}: {
  item: RoadmapItem;
  onDeleted: (id: string) => void;
}) {
  const [value, setValue] = useState(toInput(item));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await updateRoadmapItem(item.id, value);
    if (!result.success) setError(result.error);
    else setSaved(true);
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.title}" from the roadmap?`)) return;
    setDeleting(true);
    setError(null);
    const result = await deleteRoadmapItem(item.id);
    if (result.success) onDeleted(item.id);
    else {
      setError(result.error);
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-sm bg-surface-container-lowest border-1 border-outline-variant rounded-xl p-md">
      <RoadmapItemFields
        value={value}
        onChange={(next) => {
          setValue(next);
          setSaved(false);
        }}
      />
      <div className="flex flex-row items-center gap-md pt-sm border-t-1 border-outline-variant">
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-primary font-semibold cursor-pointer disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <p className="text-label-sm text-green-600">Saved</p>}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex flex-row items-center gap-1 text-red-500 font-semibold cursor-pointer disabled:opacity-40 ml-auto"
        >
          <Trash2 size={16} /> {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
      {error && <p className="text-red-500 text-label-sm">{error}</p>}
    </div>
  );
}

function NewRoadmapRow({
  nextSortOrder,
  onCreated,
  onCancel,
}: {
  nextSortOrder: number;
  onCreated: (item: RoadmapItem) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<RoadmapItemInput>({
    title: "",
    status: "planned",
    completion_percentage: null,
    release_label: "",
    description: "",
    tags: [],
    sort_order: nextSortOrder,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    const result = await createRoadmapItem(value);
    if (result.success) onCreated(result.data);
    else setError(result.error);
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-sm bg-surface-container-lowest border-1 border-dashed border-primary rounded-xl p-md">
      <RoadmapItemFields value={value} onChange={setValue} />
      <div className="flex flex-row items-center gap-md pt-sm border-t-1 border-outline-variant">
        <button
          onClick={handleCreate}
          disabled={saving}
          className="text-primary font-semibold cursor-pointer disabled:opacity-40"
        >
          {saving ? "Creating..." : "Create"}
        </button>
        <button
          onClick={onCancel}
          className="text-on-surface-variant cursor-pointer ml-auto"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-red-500 text-label-sm">{error}</p>}
    </div>
  );
}

export function RoadmapTable({ items }: { items: RoadmapItem[] }) {
  const [rows, setRows] = useState(items);
  const [adding, setAdding] = useState(false);

  function handleCreated(item: RoadmapItem) {
    setRows((prev) =>
      [...prev, item].sort((a, b) => a.sort_order - b.sort_order),
    );
    setAdding(false);
  }

  function handleDeleted(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="flex flex-col gap-margin">
      {rows.map((item) => (
        <RoadmapRow key={item.id} item={item} onDeleted={handleDeleted} />
      ))}

      {adding ? (
        <NewRoadmapRow
          nextSortOrder={
            rows.length > 0 ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 1
          }
          onCreated={handleCreated}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="self-start flex flex-row items-center gap-sm text-primary font-semibold cursor-pointer"
        >
          <Plus size={18} /> Add Roadmap Item
        </button>
      )}
    </div>
  );
}
