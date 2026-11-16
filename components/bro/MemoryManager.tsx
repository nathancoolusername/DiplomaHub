"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { addMemoryItem, deleteAllMemory, deleteMemoryItem, editMemoryItem, listMemory } from "@/app/lib/actions/bro-memory";
import { MEMORY_KINDS, MEMORY_KIND_LABEL, MEMORY_MAX_ITEMS, MEMORY_MAX_LENGTH, type MemoryKind } from "@/lib/bro/memory-rules";
import type { BroMemoryItem } from "@/lib/data/supabase/bro-memory";

const HINT: Record<MemoryKind, string> = {
  goal: "e.g. Aiming for 38 points; wants to study medicine",
  struggle: "e.g. Runs out of time on Paper 1",
  preference: "e.g. Likes hints before the full answer",
  coursework: "e.g. Physics IA on pendulums, data collected",
  note: "e.g. Mocks in January",
};

const input =
  "rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-xs text-body-md text-on-surface outline-none focus:border-primary";

/**
 * The memory list grouped by kind, with edit, delete, add and Delete everything.
 * `compact` for the side panel on /bro; a new `refreshKey` reloads the list
 * (the chat saved, forgot or undid something).
 */
export function MemoryManager({ initial, compact = false, refreshKey = 0 }: { initial: BroMemoryItem[]; compact?: boolean; refreshKey?: number }) {
  const [items, setItems] = useState(initial);
  const firstKey = useRef(refreshKey);
  useEffect(() => {
    if (refreshKey === firstKey.current) return;
    let cancelled = false;
    void listMemory().then((res) => {
      if (!cancelled && res.success) setItems(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<MemoryKind>("goal");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    setError(null);
    const res = await addMemoryItem(kind, text);
    setBusy(false);
    if (!res.success) return setError(res.error);
    setItems((all) => [...all, res.data]);
    setText("");
  };

  const removeAll = async () => {
    if (!confirm("Delete everything Bro remembers about you? This can't be undone.")) return;
    setError(null);
    const res = await deleteAllMemory();
    if (!res.success) return setError(res.error);
    setItems([]);
  };

  return (
    <div className={`flex flex-col ${compact ? "gap-md" : "gap-lg"}`}>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline-variant px-md py-lg text-center text-body-md text-on-surface-variant">
          Bro doesn&apos;t remember anything about you yet. Tell it your goals or what you find hard while you chat, or add something below.
        </p>
      ) : (
        MEMORY_KINDS.filter((k) => items.some((i) => i.kind === k)).map((k) => (
          <section key={k} className="flex flex-col gap-sm">
            <h2 className={compact ? "text-label-md font-semibold text-on-surface-variant uppercase tracking-wide" : "font-serif font-bold text-headline-sm text-on-surface"}>
              {MEMORY_KIND_LABEL[k]}
            </h2>
            <ul className="flex flex-col gap-xs">
              {items
                .filter((i) => i.kind === k)
                .map((item) => (
                  <MemoryRow
                    key={item.id}
                    item={item}
                    onSaved={(next) => setItems((all) => all.map((x) => (x.id === item.id ? next : x)))}
                    onDeleted={() => setItems((all) => all.filter((x) => x.id !== item.id))}
                    onError={setError}
                  />
                ))}
            </ul>
          </section>
        ))
      )}

      {error && (
        <p role="alert" className="text-body-md text-error">
          {error}
        </p>
      )}

      <section className={`rounded-2xl border border-outline-variant bg-surface-container-lowest flex flex-col gap-sm ${compact ? "p-md" : "p-lg"}`}>
        <h2 className={compact ? "text-label-lg font-semibold text-on-surface" : "font-serif font-bold text-headline-sm text-on-surface"}>Tell Bro something</h2>
        <form
          className={`flex flex-col gap-sm ${compact ? "" : "sm:flex-row"}`}
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <select value={kind} onChange={(e) => setKind(e.target.value as MemoryKind)} aria-label="Kind" className={input}>
            {MEMORY_KINDS.map((k) => (
              <option key={k} value={k}>
                {MEMORY_KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MEMORY_MAX_LENGTH}
            placeholder={HINT[kind]}
            aria-label="What Bro should remember"
            className={`${input} flex-1 min-w-0`}
          />
          <button
            type="submit"
            disabled={!text.trim() || busy || items.length >= MEMORY_MAX_ITEMS}
            className="rounded-full bg-primary text-on-primary px-lg py-xs text-label-lg font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-default"
          >
            Add
          </button>
        </form>
        <p className="text-label-sm text-on-surface-variant">
          {items.length} of {MEMORY_MAX_ITEMS} used. Keep it to your studies: Bro won&apos;t save anything about health, family, religion or contact details.
        </p>
      </section>

      {items.length > 0 && (
        <button type="button" onClick={removeAll} className="self-start text-label-md font-semibold text-error hover:underline cursor-pointer">
          Delete everything Bro remembers
        </button>
      )}
    </div>
  );
}

function MemoryRow({
  item,
  onSaved,
  onDeleted,
  onError,
}: {
  item: BroMemoryItem;
  onSaved: (item: BroMemoryItem) => void;
  onDeleted: () => void;
  onError: (e: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState<MemoryKind>(item.kind);
  const [text, setText] = useState(item.content);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    onError(null);
    const res = await editMemoryItem(item.id, kind, text);
    setBusy(false);
    if (!res.success) return onError(res.error);
    onSaved(res.data);
    setEditing(false);
  };

  const remove = async () => {
    setBusy(true);
    onError(null);
    const res = await deleteMemoryItem(item.id);
    setBusy(false);
    if (!res.success) return onError(res.error);
    onDeleted();
  };

  if (editing) {
    return (
      <li className="rounded-xl border border-primary p-sm flex flex-col sm:flex-row gap-sm">
        <select value={kind} onChange={(e) => setKind(e.target.value as MemoryKind)} aria-label="Kind" className={input}>
          {MEMORY_KINDS.map((k) => (
            <option key={k} value={k}>
              {MEMORY_KIND_LABEL[k]}
            </option>
          ))}
        </select>
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={MEMORY_MAX_LENGTH} aria-label="Edit" className={`${input} flex-1 min-w-0`} />
        <div className="flex gap-sm">
          <button type="button" onClick={save} disabled={busy || !text.trim()} className="rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold disabled:opacity-40 cursor-pointer">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-label-md text-on-surface-variant hover:text-primary cursor-pointer px-sm">
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-outline-variant bg-surface-container-lowest px-md py-sm flex items-center gap-sm">
      <p className="flex-1 min-w-0 text-body-md text-on-surface break-words">
        {item.content}
        {item.source === "student" && <span className="text-label-sm text-on-surface-variant"> · added by you</span>}
      </p>
      <button type="button" onClick={() => setEditing(true)} aria-label={`Edit: ${item.content}`} className="p-xs text-on-surface-variant hover:text-primary cursor-pointer">
        <Pencil size={16} />
      </button>
      <button type="button" onClick={remove} disabled={busy} aria-label={`Delete: ${item.content}`} className="p-xs text-on-surface-variant hover:text-error cursor-pointer disabled:opacity-40">
        <Trash2 size={16} />
      </button>
    </li>
  );
}
