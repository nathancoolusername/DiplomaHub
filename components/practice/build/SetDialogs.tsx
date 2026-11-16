"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CalendarPlus, ClipboardPen, FileDown, PenLine, Play, SlidersHorizontal, X } from "lucide-react";
import type { PracticeSet } from "@/lib/data/types";
import { links } from "@/lib/practice/links";
import { redeemCodeAction } from "@/app/codes/actions";
import { renameSetAction, scheduleSavedSetAction } from "@/app/practice/actions";
import { ScheduleDialog, suggestMinutes } from "./ScheduleDialog";
import { REDEEM_MESSAGES, normalizeCode } from "@/lib/codes";
import { ShareButton } from "@/components/codes/ShareButton";
import { Dialog } from "@/components/shared/Dialog";
import { DeleteSetButton } from "@/components/practice/sets/DeleteSetButton";
import { Spinner } from "@/components/spinner";

const primaryBtn = "inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer";
const iconBtn = "p-xs rounded-lg text-on-surface-variant hover:text-primary cursor-pointer";
const ghostBtn = "rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer";

export function MySetsDialog({
  sets,
  onClose,
  onEnterCode,
  isPro = false,
  inline = false,
}: {
  sets: PracticeSet[];
  onClose?: () => void;
  onEnterCode: () => void;
  /** On the Your sets page: the list itself, not a dialog. */
  inline?: boolean;
  /** Pro: each set has Schedule (a study session on the Hub that opens it). */
  isPro?: boolean;
}) {
  const [scheduling, setScheduling] = useState<PracticeSet | null>(null);
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  // Renaming: the set being renamed and the draft; new names show here at once.
  const [renaming, setRenaming] = useState<{ id: string; draft: string } | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [renameError, setRenameError] = useState<string | null>(null);
  const router = useRouter();
  const titleOf = (s: PracticeSet) => names[s.id] ?? s.title;

  const saveName = () => {
    if (!renaming) return;
    const name = renaming.draft.trim();
    if (!name) return setRenameError("Give the set a name");
    const id = renaming.id;
    start(async () => {
      setRenameError(null);
      try {
        await renameSetAction(id, name);
        setNames((n) => ({ ...n, [id]: name.slice(0, 120) }));
        setRenaming(null);
        router.refresh();
      } catch (e) {
        setRenameError(e instanceof Error ? e.message : "Couldn't rename the set");
      }
    });
  };

  const scheduleDialog = scheduling && (
      <ScheduleDialog
        defaultTitle={titleOf(scheduling)}
        // About three marks a question: a fair guess without loading the questions.
        suggestedMinutes={suggestMinutes(scheduling.questionIds.length * 3)}
        busy={busy}
        error={error}
        onClose={() => {
          setScheduling(null);
          setError(null);
        }}
        onSchedule={(slot) =>
          start(async () => {
            setError(null);
            try {
              const r = await scheduleSavedSetAction(scheduling.id, slot);
              const when = new Date(slot.startAt).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
              setDone(`Scheduled “${r.title}” for ${when}. It's on your Hub with a Start button.`);
              setScheduling(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Couldn't schedule the set");
            }
          })
        }
      />
  );
  if (scheduleDialog && !inline) return scheduleDialog;

  const list = (
    <>
      {done && (
        <p className="mb-sm rounded-lg bg-secondary-container text-on-secondary-container px-md py-sm text-label-md" role="status">
          {done}{" "}
          <Link href={links.hub()} className="font-semibold underline">
            Open the Hub
          </Link>
        </p>
      )}
      {sets.length === 0 ? (
        <div className="flex flex-col items-start gap-md">
          <p className="text-body-md text-on-surface-variant">Saved sets show up here. Got a code from a friend?</p>
          <button type="button" onClick={onEnterCode} className={primaryBtn}>
            Enter a code
          </button>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-outline-variant">
          {sets.map((s) =>
            renaming?.id === s.id ? (
              <li key={s.id} className="flex flex-col gap-xs py-sm">
                <form
                  className="flex items-center gap-sm"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveName();
                  }}
                >
                  <input
                    autoFocus
                    value={renaming.draft}
                    maxLength={120}
                    onChange={(e) => setRenaming({ id: s.id, draft: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setRenaming(null);
                      }
                    }}
                    aria-label="Set name"
                    className="flex-1 min-w-0 rounded-lg border border-outline-variant bg-surface px-sm py-xs text-body-md text-on-surface focus:outline-2 focus:outline-primary"
                  />
                  <button type="submit" disabled={busy} aria-label="Save name" className="p-xs rounded-lg text-primary hover:bg-primary/10 cursor-pointer disabled:opacity-50">
                    {busy ? <Spinner size={16} /> : <Check size={16} />}
                  </button>
                  <button type="button" onClick={() => setRenaming(null)} aria-label="Cancel" className="p-xs rounded-lg text-on-surface-variant hover:text-primary cursor-pointer">
                    <X size={16} />
                  </button>
                </form>
                {renameError && <p className="text-label-sm text-error">{renameError}</p>}
              </li>
            ) : (
              <li key={s.id} className="flex items-center gap-xs py-sm">
                <Link href={links.editSet(s)} className="flex-1 min-w-0 group" title="Change this set">
                  <p className="text-body-md font-semibold text-on-surface truncate group-hover:text-primary">{titleOf(s)}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    {s.questionIds.length} questions{s.settings.timer === "exam_pace" ? " · timed" : ""}
                    {s.shareCode ? ` · code ${s.shareCode}` : ""}
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setRenameError(null);
                    setRenaming({ id: s.id, draft: titleOf(s) });
                  }}
                  aria-label={`Rename ${titleOf(s)}`}
                  title="Rename"
                  className={iconBtn}
                >
                  <PenLine size={16} />
                </button>
                <Link href={links.editSet(s)} aria-label={`Change ${titleOf(s)}`} title="Change its settings" className={iconBtn}>
                  <SlidersHorizontal size={16} />
                </Link>
                <a href={`${links.pdf(s.id)}?print=1`} target="_blank" rel="noopener" aria-label={`PDF of ${titleOf(s)}`} title="Download as PDF" className={iconBtn}>
                  <FileDown size={16} />
                </a>
                <Link href={links.markPaper(s.id)} aria-label={`Mark a printed copy of ${titleOf(s)}`} title="Mark a printed copy" className={iconBtn}>
                  <ClipboardPen size={16} />
                </Link>
                {isPro && (
                  <button
                    type="button"
                    onClick={() => {
                      setDone(null);
                      setScheduling(s);
                    }}
                    aria-label={`Schedule ${titleOf(s)}`}
                    title="Schedule it on your Hub"
                    className={iconBtn}
                  >
                    <CalendarPlus size={16} />
                  </button>
                )}
                <ShareButton type="practice_set" targetId={s.id} title={titleOf(s)} variant="icon" />
                <DeleteSetButton setId={s.id} title={titleOf(s)} />
                <Link href={links.play(s.id)} className={`${primaryBtn} ml-xs`}>
                  <Play size={14} aria-hidden="true" /> Start
                </Link>
              </li>
            ),
          )}
        </ul>
      )}
    </>
  );

  if (inline) {
    return (
      <>
        {list}
        {scheduleDialog}
      </>
    );
  }
  return (
    <Dialog title="My sets" onClose={onClose ?? (() => {})} width="max-w-120">
      {list}
      <p className="mt-sm text-label-md">
        <Link href={links.sets()} className="font-semibold text-primary hover:underline">
          All your sets and past sets
        </Link>
      </p>
    </Dialog>
  );
}

export function EnterCodeDialog({ onClose, initialCode = "" }: { onClose: () => void; initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<{ title: string; href: string; cta: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const router = useRouter();

  const redeem = () =>
    start(async () => {
      setError(null);
      const r = await redeemCodeAction(code);
      if (!r.ok) {
        // A Hub set needs its dates chosen: that happens on the Codes page.
        if (r.reason === "needs_choice" || r.reason === "bad_date") return setError("That's a Hub set. Open it on the Codes page to choose its dates.");
        return setError(`${REDEEM_MESSAGES[r.reason].title}. ${REDEEM_MESSAGES[r.reason].body}`);
      }
      // Any code works here; a set is the usual one.
      if (r.type === "practice_set" && r.own) {
        router.push(links.markPaper(r.setId));
        return;
      }
      if (r.type === "practice_set") setResult({ title: r.title, href: links.play(r.setId), cta: "Start it", text: "to My sets" });
      else if (r.type === "hub_item") setResult({ title: r.title, href: links.hub(), cta: "See it on the Hub", text: "to your Hub" });
      else if (r.type === "hub_set") setResult({ title: `${r.count} items from “${r.name}”`, href: links.hub(), cta: "See them on the Hub", text: "to your Hub" });
      else setResult({ title: `${r.days} days of DiplomaPro`, href: links.codes(), cta: "Done", text: "to your account" });
      router.refresh(); // so My sets includes it
    });

  return (
    <Dialog
      title="Enter a code"
      onClose={onClose}
      width="max-w-100"
      footer={
        result ? (
          <Link href={result.href} className={primaryBtn}>
            <Play size={14} aria-hidden="true" /> {result.cta}
          </Link>
        ) : (
          <>
            <button type="button" onClick={onClose} className={ghostBtn}>
              Cancel
            </button>
            <button type="button" onClick={redeem} disabled={busy || normalizeCode(code).length < 5} className={primaryBtn}>
              {busy && <Spinner size={14} />}
                {busy ? "Checking…" : "Redeem"}
            </button>
          </>
        )
      }
    >
      {result ? (
        <p className="text-body-md text-on-surface">
          Added <span className="font-semibold">{result.title}</span> {result.text}.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            redeem();
          }}
          className="flex flex-col gap-sm"
        >
          <label htmlFor="share-code" className="text-label-md text-on-surface-variant">
            The code a friend shared with you (any code works on the{" "}
            <Link href={links.codes()} className="font-semibold text-primary hover:underline">
              Codes page
            </Link>{" "}
            too)
          </label>
          <input
            id="share-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoFocus
            autoComplete="off"
            maxLength={19}
            placeholder="ABCDE"
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm font-mono text-headline-md tracking-[0.3em] text-on-surface uppercase placeholder:text-outline"
          />
          {error && <p className="text-label-md text-error">{error}</p>}
        </form>
      )}
    </Dialog>
  );
}
