"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { adminExportWaitlistCsv, adminRemoveWaitlistEntry } from "@/app/lib/actions/admin-moderation";
import type { WaitlistEntry } from "@/app/lib/admin-stats";

const th = "px-md py-sm text-label-sm font-semibold text-on-surface-variant uppercase";

/** The newest waitlist emails, with remove and a CSV download of everyone. */
export function WaitlistTable({ initial, total }: { initial: WaitlistEntry[]; total: number }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(id: string, email: string) {
    if (!confirm(`Remove ${email} from the waitlist?`)) return;
    setBusy(id);
    setError(null);
    const res = await adminRemoveWaitlistEntry(id);
    if (res.success) setRows((r) => r.filter((x) => x.id !== id));
    else setError(res.error);
    setBusy(null);
  }

  async function download() {
    setBusy("csv");
    setError(null);
    const res = await adminExportWaitlistCsv();
    setBusy(null);
    if (!res.success) return setError(res.error);
    const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `diplomapro-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <p className="text-label-md text-on-surface-variant">
          Newest {rows.length.toLocaleString()} of {total.toLocaleString()}
        </p>
        <button
          type="button"
          onClick={download}
          disabled={busy === "csv"}
          className="inline-flex items-center gap-xs rounded-lg border border-primary text-primary px-md py-xs text-label-md font-semibold hover:bg-primary-fixed disabled:opacity-60 cursor-pointer"
        >
          <Download size={14} aria-hidden="true" /> {busy === "csv" ? "Preparing…" : "Download all as CSV"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-label-md text-error">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className={th}>Email</th>
              <th className={th}>Account</th>
              <th className={th}>Source</th>
              <th className={th}>Joined</th>
              <th className={th}>
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-outline-variant last:border-b-0">
                <td className="px-md py-sm text-body-md font-semibold text-on-surface break-all">{r.email}</td>
                <td className="px-md py-sm text-body-md text-on-surface-variant">{r.signedIn ? "Signed in" : "Visitor"}</td>
                <td className="px-md py-sm text-body-md text-on-surface-variant">{r.source ?? "—"}</td>
                <td className="px-md py-sm text-body-md text-on-surface-variant whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-md py-sm text-right">
                  <button
                    type="button"
                    onClick={() => remove(r.id, r.email)}
                    disabled={busy === r.id}
                    aria-label={`Remove ${r.email}`}
                    className="p-xs text-error hover:bg-error-container rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-md py-lg text-center text-on-surface-variant" colSpan={5}>
                  Nobody on the waitlist yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
