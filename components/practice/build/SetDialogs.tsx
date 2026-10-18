"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, FileDown, Pencil, Play } from "lucide-react";
import type { PracticeSet } from "@/lib/data/types";
import { links } from "@/lib/practice/links";
import { redeemCodeAction } from "@/app/practice/actions";
import { Dialog } from "@/components/shared/Dialog";
import { DeleteSetButton } from "@/components/practice/sets/DeleteSetButton";
import { Spinner } from "@/components/spinner";

const primaryBtn = "inline-flex items-center gap-xs rounded-lg bg-primary text-on-primary px-md py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer";
const ghostBtn = "rounded-lg px-md py-sm text-label-md font-semibold text-on-surface-variant hover:text-primary cursor-pointer";

export function MySetsDialog({ sets, onClose, onEnterCode }: { sets: PracticeSet[]; onClose: () => void; onEnterCode: () => void }) {
  return (
    <Dialog title="My sets" onClose={onClose} width="max-w-120">
      {sets.length === 0 ? (
        <div className="flex flex-col items-start gap-md">
          <p className="text-body-md text-on-surface-variant">Saved sets show up here. Got a code from a friend?</p>
          <button type="button" onClick={onEnterCode} className={primaryBtn}>
            Enter a code
          </button>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-outline-variant">
          {sets.map((s) => (
            <li key={s.id} className="flex items-center gap-md py-sm">
              <Link href={links.editSet(s)} className="flex-1 min-w-0 group" title="Change this set">
                <p className="text-body-md font-semibold text-on-surface truncate group-hover:text-primary">{s.title}</p>
                <p className="text-label-sm text-on-surface-variant">
                  {s.questionIds.length} questions{s.settings.timer === "exam_pace" ? " · timed" : ""}
                  {s.shareCode ? ` · code ${s.shareCode}` : ""}
                </p>
              </Link>
              <Link href={links.editSet(s)} className={ghostBtn}>
                <Pencil size={14} className="inline mr-xs" aria-hidden="true" />
                Edit
              </Link>
              <Link href={links.play(s.id)} className={primaryBtn}>
                <Play size={14} aria-hidden="true" /> Start
              </Link>
              <DeleteSetButton setId={s.id} title={s.title} />
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

export function ShareDialog({ code, title, onClose }: { code: string; title: string; onClose: () => void }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const copy = (what: "code" | "link") => {
    // /join/CODE: logs in first if needed, then opens Enter a code filled in.
    const text = what === "code" ? code : `${window.location.origin}/join/${code}`;
    void navigator.clipboard?.writeText(text);
    setCopied(what);
  };
  return (
    <Dialog title="Share this set" onClose={onClose} width="max-w-110">
      <div className="flex flex-col gap-md">
        <p className="text-body-md text-on-surface-variant">
          Friends enter this code under <span className="font-semibold text-on-surface">Enter a code</span>, or open the link, to get their own copy of “{title}”.
        </p>
        <button
          type="button"
          onClick={() => copy("code")}
          className="self-center inline-flex items-center gap-sm rounded-xl bg-surface-container px-lg py-md font-mono text-headline-md font-bold tracking-[0.3em] text-on-surface cursor-pointer"
          title="Copy code"
        >
          {code} {copied === "code" ? <Check size={18} aria-label="Copied" /> : <Copy size={18} aria-label="Copy" />}
        </button>
        <div className="flex flex-wrap justify-center gap-sm">
          <button type="button" onClick={() => copy("link")} className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary cursor-pointer">
            {copied === "link" ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copied === "link" ? "Link copied" : "Copy link"}
          </button>
          <button
            type="button"
            disabled
            title="PDF export arrives with sharing and paper (phase 5)"
            className="inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface opacity-50 cursor-not-allowed"
          >
            <FileDown size={14} aria-hidden="true" /> PDF
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export function EnterCodeDialog({ onClose, initialCode = "" }: { onClose: () => void; initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<{ setId: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const router = useRouter();

  const redeem = () =>
    start(async () => {
      setError(null);
      const r = await redeemCodeAction(code);
      if (r.ok) {
        setResult({ setId: r.setId, title: r.title });
        router.refresh(); // so My sets includes it
      }
      else setError(r.error);
    });

  return (
    <Dialog
      title="Enter a code"
      onClose={onClose}
      width="max-w-100"
      footer={
        result ? (
          <Link href={links.play(result.setId)} className={primaryBtn}>
            <Play size={14} aria-hidden="true" /> Start it
          </Link>
        ) : (
          <>
            <button type="button" onClick={onClose} className={ghostBtn}>
              Cancel
            </button>
            <button type="button" onClick={redeem} disabled={busy || code.trim().length < 4} className={primaryBtn}>
              {busy && <Spinner size={14} />}
                {busy ? "Checking…" : "Add set"}
            </button>
          </>
        )
      }
    >
      {result ? (
        <p className="text-body-md text-on-surface">
          Added <span className="font-semibold">{result.title}</span> to My sets.
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
            The 6-character code a friend shared with you
          </label>
          <input
            id="share-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoFocus
            autoComplete="off"
            maxLength={8}
            placeholder="ABC234"
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm font-mono text-headline-md tracking-[0.3em] text-on-surface uppercase placeholder:text-outline"
          />
          {error && <p className="text-label-md text-error">{error}</p>}
        </form>
      )}
    </Dialog>
  );
}
