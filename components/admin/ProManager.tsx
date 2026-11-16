"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { formatCode } from "@/lib/codes";
import {
  createProTrialCodes,
  endAllProForUser,
  endEntitlement,
  grantBetaEntitlement,
  refreshProNow,
  searchUsersForPro,
  type AdminEntitlementRow,
  type ProUserHit,
} from "@/app/lib/actions/admin-pro";

const th = "px-md py-sm text-label-sm font-semibold text-on-surface-variant uppercase";
const PLAN_LABEL: Record<AdminEntitlementRow["plan"], string> = {
  beta: "Beta",
  trial: "Trial",
  monthly: "Monthly",
  one_year: "1 year",
  two_year: "2 years",
  unlimited: "Unlimited",
};
const SOURCE_LABEL: Record<AdminEntitlementRow["source"], string> = {
  beta: "Beta",
  code: "Code",
  points: "Points",
  lemon_squeezy: "Lemon Squeezy",
  admin: "Admin",
  referral: "Referral week",
};
const DAY_CHOICES = [7, 30, 90, 365];

function date(iso: string | null): string {
  return iso === null ? "Never" : new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Give beta Pro: find a student, pick a length, grant. */
export function GrantBeta() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ProUserHit[]>([]);
  const [picked, setPicked] = useState<ProUserHit | null>(null);
  const [days, setDays] = useState(30);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (picked) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const res = await searchUsersForPro(query);
      if (!cancelled) setHits(res.success ? res.data : []);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, picked]);

  function grant() {
    if (!picked) return;
    setMessage(null);
    start(async () => {
      const res = await grantBetaEntitlement(picked.id, days, note);
      if (!res.success) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: `${picked.displayName} has beta Pro for ${days} days.` });
      setPicked(null);
      setQuery("");
      setNote("");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-md">
      {picked ? (
        <div className="flex flex-wrap items-center justify-between gap-sm rounded-xl border border-primary bg-primary-fixed/40 px-md py-sm">
          <span className="flex flex-col">
            <span className="font-semibold text-on-surface">{picked.displayName}</span>
            <span className="text-label-sm text-on-surface-variant break-all">
              {picked.email} · {picked.isPro ? `Pro until ${date(picked.expiresAt)}` : "Free"}
            </span>
          </span>
          <button type="button" onClick={() => setPicked(null)} className="text-label-md font-semibold text-primary cursor-pointer hover:underline">
            Change
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-xs">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            aria-label="Find a student"
            className="border border-outline-variant rounded-lg px-md py-sm w-full max-w-100 bg-surface-container-lowest"
          />
          {hits.length > 0 && (
            <ul className="flex flex-col rounded-xl border border-outline-variant divide-y divide-outline-variant max-w-100">
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(h)}
                    className="w-full text-left px-md py-sm hover:bg-surface-container cursor-pointer flex flex-col"
                  >
                    <span className="font-semibold text-on-surface">{h.displayName}</span>
                    <span className="text-label-sm text-on-surface-variant break-all">
                      {h.email} · {h.isPro ? `Pro until ${date(h.expiresAt)}` : "Free"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-md">
        <fieldset className="flex flex-col gap-xs">
          <legend className="text-label-md font-semibold text-on-surface-variant mb-xs">Length</legend>
          <div className="inline-flex rounded-full border border-outline-variant bg-surface-container-lowest p-0.5">
            {DAY_CHOICES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                aria-pressed={days === d}
                className={`rounded-full px-md py-1 text-label-md font-semibold cursor-pointer ${
                  days === d ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {d === 365 ? "1 year" : `${d} days`}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-xs flex-1 min-w-48">
          <span className="text-label-md font-semibold text-on-surface-variant">Note (only admins see it)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="e.g. Beta tester from Discord"
            className="border border-outline-variant rounded-lg px-md py-sm bg-surface-container-lowest"
          />
        </label>
        <button
          type="button"
          onClick={grant}
          disabled={!picked || pending}
          className="rounded-lg bg-primary text-on-primary px-lg py-sm font-semibold disabled:opacity-50 cursor-pointer"
        >
          {pending ? "Giving…" : "Give beta Pro"}
        </button>
      </div>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`text-label-md ${message.ok ? "text-primary" : "text-error"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

const USE_CHOICES: { label: string; value: number | null }[] = [
  { label: "1 each", value: 1 },
  { label: "10 each", value: 10 },
  { label: "Unlimited", value: null },
];
const EXPIRY_CHOICES: { label: string; value: number | null }[] = [
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "Never", value: null },
];

function Choice<T>({ legend, options, value, onChange }: { legend: string; options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset className="flex flex-col gap-xs">
      <legend className="text-label-md font-semibold text-on-surface-variant mb-xs">{legend}</legend>
      <div className="inline-flex rounded-full border border-outline-variant bg-surface-container-lowest p-0.5">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={`rounded-full px-md py-1 text-label-md font-semibold cursor-pointer ${
              value === o.value ? "bg-primary text-on-primary" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Batch of 10-character DiplomaPro trial codes (beta invites, contest prizes). */
export function MakeProCodes() {
  const [count, setCount] = useState(10);
  const [days, setDays] = useState(30);
  const [maxUses, setMaxUses] = useState<number | null>(1);
  const [expiresIn, setExpiresIn] = useState<number | null>(90);
  const [note, setNote] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  function make() {
    setError(null);
    setCopied(false);
    start(async () => {
      const res = await createProTrialCodes({ count, days, maxUses, expiresInDays: expiresIn, note });
      if (!res.success) return setError(res.error);
      setCodes(res.data.codes);
    });
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap items-end gap-md">
        <label className="flex flex-col gap-xs w-24">
          <span className="text-label-md font-semibold text-on-surface-variant">How many</span>
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(500, Math.floor(Number(e.target.value) || 1))))}
            className="border border-outline-variant rounded-lg px-md py-sm bg-surface-container-lowest"
          />
        </label>
        <Choice legend="Pro for" options={DAY_CHOICES.map((d) => ({ label: d === 365 ? "1 year" : `${d} days`, value: d }))} value={days} onChange={setDays} />
        <Choice legend="Uses" options={USE_CHOICES} value={maxUses} onChange={setMaxUses} />
        <Choice legend="Code expires in" options={EXPIRY_CHOICES} value={expiresIn} onChange={setExpiresIn} />
      </div>
      <div className="flex flex-wrap items-end gap-md">
        <label className="flex flex-col gap-xs flex-1 min-w-48">
          <span className="text-label-md font-semibold text-on-surface-variant">Note (only admins see it)</span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="e.g. Beta wave 1, or Contest prize"
            className="border border-outline-variant rounded-lg px-md py-sm bg-surface-container-lowest"
          />
        </label>
        <button type="button" onClick={make} disabled={pending} className="rounded-lg bg-primary text-on-primary px-lg py-sm font-semibold disabled:opacity-50 cursor-pointer">
          {pending ? "Making…" : `Make ${count} code${count === 1 ? "" : "s"}`}
        </button>
      </div>
      {error && <p role="alert" className="text-label-md text-error">{error}</p>}
      {codes.length > 0 && (
        <div className="flex flex-col gap-sm">
          <div className="flex items-center justify-between gap-sm">
            <p role="status" className="text-label-md text-primary">
              {codes.length} code{codes.length === 1 ? "" : "s"} made. They also show under My codes on /codes.
            </p>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(codes.map(formatCode).join("\n")).then(() => setCopied(true))}
              className="rounded-lg border border-primary text-primary px-md py-xs text-label-md font-semibold hover:bg-primary-fixed cursor-pointer"
            >
              {copied ? "Copied" : "Copy all"}
            </button>
          </div>
          <pre className="max-h-64 overflow-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-md font-mono text-label-md text-on-surface">
            {codes.map(formatCode).join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}

/** Runs the hourly pg_cron refresh straight away. */
export function RefreshNow() {
  const router = useRouter();
  const [text, setText] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-sm">
      {text && <span className="text-label-md text-on-surface-variant">{text}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await refreshProNow();
            setText(res.success ? `Updated ${res.data.updated} account${res.data.updated === 1 ? "" : "s"}` : res.error);
            router.refresh();
          })
        }
        className="inline-flex items-center gap-xs rounded-lg border border-primary text-primary px-md py-xs text-label-md font-semibold hover:bg-primary-fixed disabled:opacity-60 cursor-pointer"
      >
        <RefreshCw size={14} aria-hidden="true" className={pending ? "animate-spin" : ""} /> Refresh now
      </button>
    </div>
  );
}

const STATUS_STYLE: Record<AdminEntitlementRow["status"], string> = {
  active: "bg-primary text-on-primary",
  scheduled: "bg-tertiary-container text-on-tertiary-container",
  ended: "bg-surface-container text-on-surface-variant",
};

/** Every entitlement, newest first, with End on the ones still running or scheduled. */
export function EntitlementsTable({ rows, filteredUserId }: { rows: AdminEntitlementRow[]; filteredUserId?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function end(row: AdminEntitlementRow) {
    if (!confirm(`End ${row.displayName}'s ${PLAN_LABEL[row.plan]} Pro now?`)) return;
    setBusy(row.id);
    setError(null);
    const res = await endEntitlement(row.id);
    if (!res.success) setError(res.error);
    setBusy(null);
    router.refresh();
  }

  async function endAll(userId: string, name: string) {
    if (!confirm(`End all of ${name}'s Pro now?`)) return;
    setBusy(userId);
    setError(null);
    const res = await endAllProForUser(userId);
    if (!res.success) setError(res.error);
    setBusy(null);
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-outline-variant px-md py-lg text-center text-body-md text-on-surface-variant">No entitlements yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-sm">
      {filteredUserId && (
        <div className="flex flex-wrap items-center gap-md">
          <Link href="/admin/pro" className="text-label-md font-semibold text-primary hover:underline">
            ← Everyone
          </Link>
          {rows.some((r) => r.status !== "ended" && r.plan !== "unlimited") && (
            <button
              type="button"
              onClick={() => endAll(filteredUserId, rows[0].displayName)}
              disabled={busy === filteredUserId}
              className="text-label-md font-semibold text-error hover:underline cursor-pointer disabled:opacity-50"
            >
              End all their Pro
            </button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-label-md text-error">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-outline-variant">
              <th className={th}>Student</th>
              <th className={th}>Plan</th>
              <th className={th}>Source</th>
              <th className={th}>Starts</th>
              <th className={th}>Ends</th>
              <th className={th}>Status</th>
              <th className={th}>
                <span className="sr-only">End</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-outline-variant last:border-b-0 align-top">
                <td className="px-md py-sm">
                  <Link href={`/admin/pro?user=${r.userId}`} className="flex flex-col hover:underline w-fit">
                    <span className="font-semibold text-on-surface">{r.displayName}</span>
                    <span className="text-label-sm text-on-surface-variant break-all">{r.email}</span>
                  </Link>
                  {r.note && <p className="text-label-sm text-on-surface-variant mt-xs">{r.note}</p>}
                </td>
                <td className="px-md py-sm text-body-md text-on-surface">{PLAN_LABEL[r.plan]}</td>
                <td className="px-md py-sm text-body-md text-on-surface-variant">
                  {SOURCE_LABEL[r.source]}
                  {r.lsOrderId && <span className="block text-label-sm">#{r.lsOrderId}</span>}
                </td>
                <td className="px-md py-sm text-body-md text-on-surface-variant whitespace-nowrap">{date(r.startsAt)}</td>
                <td className="px-md py-sm text-body-md text-on-surface-variant whitespace-nowrap">{date(r.expiresAt)}</td>
                <td className="px-md py-sm">
                  <span className={`rounded-full px-sm py-0.5 text-label-sm font-semibold ${STATUS_STYLE[r.status]}`}>
                    {r.status === "active" ? "Active" : r.status === "scheduled" ? "Scheduled" : "Ended"}
                  </span>
                </td>
                <td className="px-md py-sm text-right">
                  {r.status !== "ended" && r.plan !== "unlimited" && (
                    <button
                      type="button"
                      onClick={() => end(r)}
                      disabled={busy === r.id}
                      className="text-label-md font-semibold text-error hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {busy === r.id ? "Ending…" : "End now"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
