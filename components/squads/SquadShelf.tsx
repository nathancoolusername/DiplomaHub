"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CalendarDays, Check, ClipboardList, ExternalLink, ListChecks, Play, Trash2 } from "lucide-react";
import type { ShelfItem } from "@/lib/data";
import { redeemCodeAction } from "@/app/codes/actions";
import { removeSquadShareAction } from "@/app/squads/actions";
import { REDEEM_MESSAGES } from "@/lib/codes";
import { links } from "@/lib/practice/links";
import { Spinner } from "@/components/spinner";

const ago = (iso: string) => {
  const h = Math.round((Date.now() - Date.parse(iso)) / 3600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
};
const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

type Added = { href: string; label: string };

/**
 * What the squad has shared: practice sets, Hub items (test dates) and Hub
 * plans. Add uses the normal code flow, so each student gets their own copy
 * and the sharer's code counts the use. Plans open the Codes page to pick dates.
 */
export function SquadShelf({ squadId, items, isOwner }: { squadId: string; items: ShelfItem[]; isOwner: boolean }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [working, setWorking] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, Added>>({});
  const [error, setError] = useState<{ id: string; text: string } | null>(null);

  const add = (it: ShelfItem) =>
    it.code &&
    start(async () => {
      const code = it.code!;
      setError(null);
      setWorking(it.id);
      try {
        const r = await redeemCodeAction(code);
        if (r.ok && r.type === "practice_set") setAdded((a) => ({ ...a, [it.id]: { href: links.play(r.setId), label: "Start" } }));
        else if (r.ok) setAdded((a) => ({ ...a, [it.id]: { href: links.hub(), label: "On your Hub" } }));
        else if (r.reason === "already_redeemed") setAdded((a) => ({ ...a, [it.id]: { href: it.type === "practice_set" ? links.sets() : links.hub(), label: "Already added" } }));
        else if (r.reason === "needs_choice" || r.reason === "bad_date") router.push(links.codes(code));
        else setError({ id: it.id, text: REDEEM_MESSAGES[r.reason].title });
      } catch {
        setError({ id: it.id, text: "Couldn't add it just now" });
      } finally {
        setWorking(null);
      }
    });

  const remove = (it: ShelfItem) =>
    start(async () => {
      try {
        await removeSquadShareAction(squadId, it.id);
        router.refresh();
      } catch (e) {
        setError({ id: it.id, text: e instanceof Error ? e.message : "Couldn't remove it" });
      }
    });

  return (
    <section className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-lg flex flex-col gap-md" aria-labelledby="squad-shelf">
      <div className="flex flex-wrap items-baseline justify-between gap-sm">
        <h2 id="squad-shelf" className="font-serif font-bold text-headline-md text-on-surface">
          The shelf
        </h2>
        <p className="text-label-sm text-on-surface-variant">Share any set, test date, Hub plan or library resource, then pick this squad.</p>
      </div>
      {items.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">
          Nothing here yet. Open{" "}
          <Link href={links.sets()} className="font-semibold text-primary hover:underline">
            your sets
          </Link>{" "}
          or a test on{" "}
          <Link href={links.hub()} className="font-semibold text-primary hover:underline">
            your Hub
          </Link>
          , tap Share, and send it here. Resources go from the squad button on any resource page.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-outline-variant">
          {items.map((it) => {
            const done = added[it.id];
            const icon =
              it.type === "practice_set" ? <ListChecks size={16} /> : it.type === "hub_set" ? <ClipboardList size={16} /> : it.type === "resource" ? <BookOpen size={16} /> : <CalendarDays size={16} />;
            const detail =
              it.type === "practice_set"
                ? [it.subjectName, it.questions ? `${it.questions} questions` : null]
                : it.type === "hub_item"
                  ? [it.kind === "test" ? "Test" : it.kind === "mock" ? "Mock" : it.kind === "deadline" ? "Deadline" : "Hub item", it.subjectName, it.startsAt ? when(it.startsAt) : null]
                  : it.type === "resource"
                    ? [it.typeTag, it.subjectTag]
                    : [`Plan · ${it.count ?? ""} items`, it.startsAt ? `from ${when(it.startsAt)}` : null];
            return (
              <li key={it.id} className="flex flex-wrap items-center gap-sm py-sm">
                <span className="w-9 h-9 shrink-0 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center" aria-hidden="true">
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-semibold text-on-surface truncate">{it.title}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {detail.filter(Boolean).join(" · ")} · {it.isMine ? "you" : it.sharedBy}, {ago(it.createdAt)}
                    {it.type !== "resource" && it.uses > 0 ? ` · added ${it.uses}×` : ""}
                  </p>
                  {it.note && <p className="text-label-md text-on-surface">“{it.note}”</p>}
                  {error?.id === it.id && <p className="text-label-sm text-error">{error.text}</p>}
                </div>
                <div className="flex items-center justify-end gap-xs basis-full sm:basis-auto">
                  {it.type === "resource" && it.resourceId ? (
                    <Link href={`/resources/${it.resourceId}`} className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90">
                      <ExternalLink size={12} aria-hidden="true" /> Open
                    </Link>
                  ) : it.ownCode ? (
                    <span className="text-label-sm text-on-surface-variant">Yours</span>
                  ) : done ? (
                    <Link href={done.href} className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90">
                      {done.label === "Start" ? <Play size={12} aria-hidden="true" /> : <Check size={12} aria-hidden="true" />} {done.label}
                    </Link>
                  ) : it.added ? (
                    <span className="inline-flex items-center gap-xs text-label-md font-semibold text-on-surface-variant">
                      <Check size={14} aria-hidden="true" /> Added
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => add(it)}
                      className="inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-xs text-label-md font-semibold hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
                    >
                      {working === it.id && <Spinner size={12} />}
                      {it.type === "practice_set" ? "Add to my sets" : it.type === "hub_set" ? "Add the plan" : "Add to my Hub"}
                    </button>
                  )}
                  {(it.isMine || isOwner) && (
                    <button type="button" disabled={busy} onClick={() => remove(it)} aria-label={`Take ${it.title} off the shelf`} title="Take it off the shelf" className="p-xs rounded-lg text-on-surface-variant hover:text-error cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
