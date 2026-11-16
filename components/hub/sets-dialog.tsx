"use client";

import { useEffect, useState } from "react";
import { CalendarRange, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { deleteHubSet, listHubSets, renameHubSet, shareHubSet, type HubSetSummary } from "@/app/lib/actions/hub-sets";
import { Dialog } from "@/components/shared/Dialog";
import { ShareCodeDialog } from "@/components/codes/ShareCodeDialog";
import { Spinner } from "@/components/spinner";
import type { CustomSubject, HubItem } from "./mock-data";
import { ShareSetDialog } from "./share-set-dialog";

const SOURCE: Record<HubSetSummary["source"], string> = { student: "Made by you", bro: "Made with Bro", code: "From a code", import: "From an import" };

function range(s: HubSetSummary): string {
  if (!s.firstStart) return "No items left";
  const f = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const a = f(s.firstStart);
  const b = s.lastEnd ? f(s.lastEnd) : a;
  return a === b ? a : `${a} – ${b}`;
}

/**
 * "Sets" on the Hub: the student's Hub sets (migration 46): named groups of
 * items like a mock timetable or a revision plan. Make one from your items,
 * share it as a code, rename it, or delete it (the items stay).
 */
export function SetsDialog({ items, customSubjects, onClose }: { items: HubItem[]; customSubjects: CustomSubject[]; onClose: () => void }) {
  const [sets, setSets] = useState<HubSetSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [shared, setShared] = useState<{ code: string; name: string } | null>(null);

  const load = async () => {
    const r = await listHubSets();
    if (r.success) setSets(r.data);
    else setError(r.error);
  };
  useEffect(() => {
    let cancelled = false;
    listHubSets().then((r) => {
      if (cancelled) return;
      if (r.success) setSets(r.data);
      else setError(r.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (creating) {
    return (
      <ShareSetDialog
        mode="create"
        items={items}
        customSubjects={customSubjects}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          void load();
        }}
      />
    );
  }
  if (shared) return <ShareCodeDialog type="hub_set" code={shared.code} title={shared.name} useCount={0} onClose={() => setShared(null)} />;

  const act = async (id: string, fn: () => Promise<void>) => {
    setBusy(id);
    setError(null);
    await fn();
    setBusy(null);
  };

  return (
    <Dialog
      title="Your sets"
      onClose={onClose}
      width="max-w-140"
      footer={
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 cursor-pointer"
        >
          <Plus size={16} /> New set
        </button>
      }
    >
      <div className="flex flex-col gap-md">
        <p className="text-body-md text-on-surface-variant">
          Sets keep items together, like your mock timetable or a revision plan. Share one as a code and friends get a copy on their Hub.
        </p>
        {error && (
          <p role="alert" className="text-label-md text-error">
            {error}
          </p>
        )}
        {sets === null ? (
          <p className="inline-flex items-center gap-sm text-body-md text-on-surface-variant">
            <Spinner size={14} /> Loading your sets
          </p>
        ) : sets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant px-md py-lg text-center text-body-md text-on-surface-variant">
            No sets yet. Make one from your items, import a calendar, or ask Bro to plan your mocks.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-outline-variant rounded-xl border border-outline-variant">
            {sets.map((s) => (
              <li key={s.id} className="px-md py-sm flex flex-col gap-xs">
                {renaming?.id === s.id ? (
                  <form
                    className="flex gap-sm"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void act(s.id, async () => {
                        const r = await renameHubSet(s.id, renaming.name);
                        if (!r.success) return setError(r.error);
                        setRenaming(null);
                        await load();
                      });
                    }}
                  >
                    <input
                      value={renaming.name}
                      onChange={(e) => setRenaming({ id: s.id, name: e.target.value })}
                      maxLength={80}
                      autoFocus
                      aria-label="Set name"
                      className="flex-1 min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-xs text-body-md text-on-surface"
                    />
                    <button type="submit" className="text-label-md font-semibold text-primary hover:underline cursor-pointer">
                      Save
                    </button>
                    <button type="button" onClick={() => setRenaming(null)} className="text-label-md text-on-surface-variant hover:text-primary cursor-pointer">
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex items-start gap-sm">
                    <CalendarRange size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-md font-semibold text-on-surface truncate">{s.name}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        {s.itemCount} item{s.itemCount === 1 ? "" : "s"} · {range(s)} · {SOURCE[s.source]}
                      </p>
                    </div>
                  </div>
                )}
                {renaming?.id !== s.id && (
                  <div className="flex flex-wrap gap-md pl-[26px]">
                    <button
                      type="button"
                      disabled={busy === s.id || s.itemCount === 0}
                      onClick={() =>
                        void act(s.id, async () => {
                          const r = await shareHubSet(s.id);
                          if (!r.success) return setError(r.error);
                          setShared({ code: r.data.code, name: r.data.name });
                        })
                      }
                      className="inline-flex items-center gap-1 text-label-md font-semibold text-primary hover:underline cursor-pointer disabled:opacity-40"
                    >
                      <Share2 size={13} /> Share
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenaming({ id: s.id, name: s.name })}
                      className="inline-flex items-center gap-1 text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer"
                    >
                      <Pencil size={13} /> Rename
                    </button>
                    <button
                      type="button"
                      disabled={busy === s.id}
                      onClick={() => {
                        if (!confirm(`Delete the set "${s.name}"? Its items stay in your Hub.`)) return;
                        void act(s.id, async () => {
                          const r = await deleteHubSet(s.id);
                          if (!r.success) return setError(r.error);
                          await load();
                        });
                      }}
                      className="inline-flex items-center gap-1 text-label-md font-semibold text-on-surface-variant hover:text-error cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 size={13} /> Delete set
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
