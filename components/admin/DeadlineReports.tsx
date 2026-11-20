"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, EyeOff, Flag } from "lucide-react";
import { resolveReport } from "@/app/lib/actions/admin-deadline";
import type { ReportedMessage } from "@/app/lib/admin-deadline-stats";

const BTN = "inline-flex items-center gap-xs rounded-lg px-sm py-xs text-label-md font-semibold disabled:opacity-50 cursor-pointer";

/** Reported room chat: the message as it was sent, who wrote it, who reported it. Hide or dismiss. */
export function DeadlineReports({ reports }: { reports: ReportedMessage[] }) {
  if (!reports.length)
    return <p className="rounded-xl border border-dashed border-outline-variant px-md py-lg text-center text-body-md text-on-surface-variant">No reported messages.</p>;
  return (
    <ul className="flex flex-col gap-sm">
      {reports.map((r) => <ReportRow key={r.messageId} r={r} />)}
    </ul>
  );
}

function ReportRow({ r }: { r: ReportedMessage }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const act = (kind: "hide" | "dismiss") => start(async () => {
    const res = await resolveReport(r.messageId, kind);
    if (!res.success) setError(res.error);
    else router.refresh();
  });
  return (
    <li className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-md flex flex-col gap-sm">
      <p className="text-body-lg text-on-surface break-words">“{r.body}”</p>
      <p className="text-label-md text-on-surface-variant">
        by <strong className="text-on-surface">{r.author.name}</strong>
        {r.author.reportsTotal > 1 && <span className="text-error font-semibold"> · {r.author.reportsTotal} of their messages reported</span>}
        {" · "}<Flag size={11} className="inline -mt-0.5" aria-hidden="true" /> {r.reporters.length} report{r.reporters.length === 1 ? "" : "s"} ({r.reporters.join(", ")})
        {r.reasons.length > 0 && <> · “{r.reasons.join("”, “")}”</>}
        {" · "}{new Date(r.firstAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
      </p>
      <div className="flex flex-wrap items-center gap-xs">
        {r.hidden === null ? (
          <span className="text-label-md text-on-surface-variant">The room has closed (rooms last 24 h), so the message is gone.</span>
        ) : r.hidden ? (
          <span className="text-label-md text-on-surface-variant">Already hidden (3 people reported it).</span>
        ) : (
          <button type="button" disabled={pending} onClick={() => act("hide")} className={`${BTN} bg-error text-on-error`}>
            <EyeOff size={14} aria-hidden="true" />Hide it for everyone
          </button>
        )}
        <button type="button" disabled={pending} onClick={() => act("dismiss")} className={`${BTN} border border-outline-variant text-on-surface`}>
          <Check size={14} aria-hidden="true" />{r.hidden === false ? "It's fine: dismiss" : "Done: clear"}
        </button>
      </div>
      {error && <p className="text-label-md text-error">{error}</p>}
    </li>
  );
}
