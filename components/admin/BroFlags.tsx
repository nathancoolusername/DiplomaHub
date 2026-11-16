"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { reviewBroFlag, type AdminBroFlag, type BroFlagStatus } from "@/app/lib/actions/admin-bro";

const REASON: Record<AdminBroFlag["reason"], string> = {
  wrong: "Wrong answer",
  ib_fact: "Wrong about the IB",
  unhelpful: "Not helpful",
  other: "Something else",
};

const STATUS: Record<BroFlagStatus, { label: string; style: string }> = {
  open: { label: "Open", style: "bg-error-container text-on-error-container" },
  fixed: { label: "Fixed", style: "bg-secondary-container text-on-secondary-container" },
  not_a_problem: { label: "Not a problem", style: "bg-surface-container text-on-surface-variant" },
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** The review queue: each flagged reply with the question before it, and Fixed / Not a problem. */
export function BroFlags({ flags, showReviewed }: { flags: AdminBroFlag[]; showReviewed: boolean }) {
  return (
    <div className="flex flex-col gap-md">
      <Link href={showReviewed ? "/admin/bro" : "/admin/bro?reviewed=1"} className="self-start text-label-md font-semibold text-primary hover:underline">
        {showReviewed ? "Show open flags only" : "Show reviewed flags too"}
      </Link>
      {flags.length === 0 ? (
        // Same look as Empty in ./ui, which can't be imported here: ui.tsx pulls in server-only code.
        <p className="rounded-xl border border-dashed border-outline-variant px-md py-lg text-center text-body-md text-on-surface-variant">
          {showReviewed ? "No flags yet." : "No open flags. Students flag replies with “This is wrong” under Bro's answers."}
        </p>
      ) : (
        flags.map((f) => <FlagCard key={f.id} flag={f} />)
      )}
    </div>
  );
}

function FlagCard({ flag }: { flag: AdminBroFlag }) {
  const router = useRouter();
  const [note, setNote] = useState(flag.adminNote ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function set(status: BroFlagStatus) {
    setBusy(true);
    setError(null);
    const res = await reviewBroFlag(flag.id, status, note);
    if (!res.success) setError(res.error);
    setBusy(false);
    router.refresh();
  }

  return (
    <article className="rounded-xl border border-outline-variant p-md flex flex-col gap-sm">
      <header className="flex flex-wrap items-center gap-sm">
        <span className={`rounded-full px-sm py-0.5 text-label-sm font-semibold ${STATUS[flag.status].style}`}>{STATUS[flag.status].label}</span>
        <span className="text-label-md font-semibold text-on-surface">{REASON[flag.reason]}</span>
        <span className="text-label-sm text-on-surface-variant">
          {when(flag.createdAt)} ·{" "}
          <Link href={`/admin/pro?user=${flag.userId}`} className="hover:underline">
            {flag.name}
          </Link>
          {flag.email && <span className="break-all"> ({flag.email})</span>}
        </span>
      </header>
      {flag.note && (
        <p className="text-body-md text-on-surface">
          <span className="font-semibold">Student&apos;s note:</span> {flag.note}
        </p>
      )}
      <div className="grid md:grid-cols-2 gap-sm">
        <div className="rounded-lg bg-surface-container-low p-sm min-w-0">
          <p className="text-label-sm font-semibold text-on-surface-variant uppercase mb-xs">Student asked</p>
          <p className="text-body-md text-on-surface whitespace-pre-wrap break-words">{flag.question ?? "(not saved)"}</p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-sm min-w-0">
          <p className="text-label-sm font-semibold text-on-surface-variant uppercase mb-xs">Bro replied</p>
          <p className="text-body-md text-on-surface whitespace-pre-wrap break-words max-h-80 overflow-y-auto">{flag.answer}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-sm">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          placeholder="Note to self (what you changed)"
          aria-label="Admin note"
          className="flex-1 min-w-48 rounded-lg border border-outline-variant bg-transparent px-sm py-xs text-body-md text-on-surface outline-none focus:border-primary"
        />
        {flag.status === "open" ? (
          <>
            <button type="button" disabled={busy} onClick={() => set("fixed")} className="rounded-full bg-primary text-on-primary px-md py-xs text-label-md font-semibold cursor-pointer disabled:opacity-50">
              Fixed
            </button>
            <button type="button" disabled={busy} onClick={() => set("not_a_problem")} className="rounded-full border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface cursor-pointer disabled:opacity-50">
              Not a problem
            </button>
          </>
        ) : (
          <button type="button" disabled={busy} onClick={() => set("open")} className="rounded-full border border-outline-variant px-md py-xs text-label-md font-semibold text-on-surface cursor-pointer disabled:opacity-50">
            Open again
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-label-md text-error">{error}</p>}
    </article>
  );
}
