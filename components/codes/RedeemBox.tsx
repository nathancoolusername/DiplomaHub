"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CalendarCheck, CalendarRange, CheckCircle2, Crown, Play } from "lucide-react";
import { formatCode, lookalikes, normalizeCode, REDEEM_MESSAGES, type HubSetChoice as Choice, type HubSetPreview, type RedeemResult } from "@/lib/codes";
import { HubSetChoice } from "./HubSetChoice";
import { links } from "@/lib/practice/links";
import { redeemCodeAction } from "@/app/codes/actions";
import { Spinner } from "@/components/spinner";

const primaryBtn =
  "inline-flex items-center justify-center gap-xs rounded-lg bg-primary text-on-primary px-lg py-sm text-label-md font-semibold hover:bg-primary/90 disabled:opacity-50 cursor-pointer";
const secondaryBtn =
  "inline-flex items-center gap-xs rounded-lg border border-outline-variant px-md py-sm text-label-md font-semibold text-on-surface hover:border-primary cursor-pointer";

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

/** The big "enter a code" box: any code type, a clear message for each way it can fail. */
export function RedeemBox({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(() => formatCode(initialCode));
  const [result, setResult] = useState<RedeemResult | null>(null);
  // A Hub set waiting for "keep the dates" or "start on…": nothing used yet.
  const [hubSet, setHubSet] = useState<{ code: string; preview: HubSetPreview; error: string | null } | null>(null);
  const [busy, start] = useTransition();

  const code = normalizeCode(value);
  const bad = lookalikes(value);
  // 4 characters is a Deadline room: Redeem takes you to it.
  const canSubmit = code.length >= 4 && bad.length === 0 && !busy;

  const finish = (r: RedeemResult) => {
    setResult(r);
    if (r.ok) {
      setValue("");
      router.refresh(); // My codes, Pro badge, nav
    }
  };

  const redeem = () => {
    if (!canSubmit) return;
    if (code.length === 4) return router.push(`/play/deadline/${code}?via=code`);
    setHubSet(null);
    start(async () => {
      const r = await redeemCodeAction(code);
      if (!r.ok && r.reason === "needs_choice") {
        setResult(null);
        setHubSet({ code, preview: r.preview, error: null });
        return;
      }
      finish(r);
    });
  };

  const redeemHubSet = (choice: Choice) => {
    if (!hubSet) return;
    start(async () => {
      const r = await redeemCodeAction(hubSet.code, choice);
      if (!r.ok && (r.reason === "bad_date" || r.reason === "needs_choice")) {
        setHubSet({ ...hubSet, error: r.reason === "bad_date" ? r.message : "Choose how to add it." });
        return;
      }
      setHubSet(null);
      finish(r);
    });
  };

  return (
    <section
      aria-labelledby="redeem-title"
      className="flex flex-col gap-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl"
    >
      <div className="flex flex-col gap-xs">
        <h2 id="redeem-title" className="font-serif font-bold text-headline-md text-on-surface">
          Enter a code
        </h2>
        <p className="text-body-md text-on-surface-variant">For a set, Hub item or Hub set a friend shared, or a DiplomaPro code.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          redeem();
        }}
        className="flex flex-col sm:flex-row gap-sm"
      >
        <label htmlFor="redeem-code" className="sr-only">
          Code
        </label>
        <input
          id="redeem-code"
          value={value}
          onChange={(e) => {
            // Letters, digits and the dashes we print, upper case; up to 16 characters of code.
            const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-\s]/g, "");
            if (normalizeCode(raw).length <= 16) setValue(raw);
            if (result && !result.ok) setResult(null);
            if (hubSet) setHubSet(null);
          }}
          autoFocus={!initialCode}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="ABCDE"
          aria-invalid={bad.length > 0 || (result !== null && !result.ok)}
          aria-describedby="redeem-help"
          className="flex-1 min-w-0 rounded-xl border-2 border-outline-variant focus:border-primary focus:outline-none bg-surface px-lg py-md font-mono text-headline-md md:text-headline-lg font-bold tracking-[0.25em] text-on-surface uppercase placeholder:text-outline/60"
        />
        <button type="submit" disabled={!canSubmit} className={`${primaryBtn} sm:min-w-36 py-md text-body-md`}>
          {busy && <Spinner size={16} />}
          {busy ? "Checking…" : "Redeem"}
        </button>
      </form>

      <div id="redeem-help" aria-live="polite">
        {bad.length > 0 ? (
          <p className="text-label-md text-error">
            {`Codes never use ${bad.join(", ")} (they're too easy to mix up). Check you've copied it exactly.`}
          </p>
        ) : hubSet ? (
          <HubSetChoice preview={hubSet.preview} busy={busy} error={hubSet.error} onConfirm={redeemHubSet} onCancel={() => setHubSet(null)} />
        ) : result ? (
          <Outcome result={result} code={value} />
        ) : (
          <p className="text-label-md text-on-surface-variant">Spaces, dashes and lower case don&apos;t matter.</p>
        )}
      </div>
    </section>
  );
}

/** One redeem result: the message for a failure, or what the code gave and where to go next. */
export function Outcome({ result, code }: { result: RedeemResult; /** The code tried: a 6-character one might be a squad's. */ code?: string }) {
  if (!result.ok) {
    // needs_choice is handled by HubSetChoice; bad_date only happens there.
    const m =
      result.reason === "needs_choice"
        ? { title: "Choose how to add this plan", body: "Keep its dates or pick a start day." }
        : result.reason === "bad_date"
          ? { title: "That start date doesn't work", body: result.message }
          : REDEEM_MESSAGES[result.reason];
    return (
      <div role="alert" className="flex items-start gap-sm rounded-xl border border-error/40 bg-error-container/40 px-md py-sm">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
        <div className="flex flex-col">
          <p className="text-body-md font-semibold text-on-surface">{m.title}</p>
          <p className="text-label-md text-on-surface-variant">{m.body}</p>
          {result.reason === "not_found" && code && normalizeCode(code).length === 6 && (
            <Link href={`/squads/join/${normalizeCode(code)}`} className="text-label-md font-semibold text-primary hover:underline">
              Is it a squad code? Join the squad
            </Link>
          )}
        </div>
      </div>
    );
  }

  const shell = (icon: React.ReactNode, title: React.ReactNode, body: React.ReactNode, actions: React.ReactNode) => (
    <div role="status" className="flex flex-col sm:flex-row sm:items-center gap-md rounded-xl border border-primary/40 bg-primary-fixed/40 px-md py-md">
      <div className="flex items-start gap-sm flex-1 min-w-0">
        {icon}
        <div className="flex flex-col min-w-0">
          <p className="text-body-md font-semibold text-on-surface">{title}</p>
          <p className="text-label-md text-on-surface-variant">{body}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-sm">{actions}</div>
    </div>
  );
  const ok = <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />;

  switch (result.type) {
    case "practice_set":
      if (result.own)
        return shell(
          ok,
          <>That&apos;s your paper: “{result.title}”</>,
          "Put in the letters you circled, then tick your marks against the markscheme.",
          <Link href={links.markPaper(result.setId)} className={primaryBtn}>
            <Play size={14} aria-hidden="true" /> Mark it
          </Link>,
        );
      return shell(
        ok,
        <>Added “{result.title}” to My sets</>,
        "It's your own copy: your answers and marks stay yours.",
        <Link href={links.play(result.setId)} className={primaryBtn}>
          <Play size={14} aria-hidden="true" /> Start it
        </Link>,
      );
    case "hub_item":
      return shell(
        <CalendarCheck size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />,
        <>Added “{result.title}” to your Hub</>,
        <>On {longDate(result.startAt)}, as a to-do.</>,
        <Link href={links.hub()} className={secondaryBtn}>
          See it on the Hub
        </Link>,
      );
    case "hub_set":
      return shell(
        <CalendarRange size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />,
        <>
          Added {result.count} item{result.count === 1 ? "" : "s"} from “{result.name}” to your Hub
        </>,
        result.shiftDays === 0 ? <>With the dates from the shared plan.</> : <>Moved to start on {longDate(result.firstStart)}.</>,
        <Link href={links.hub()} className={secondaryBtn}>
          See them on the Hub
        </Link>,
      );
    case "pro_trial":
      return shell(
        <Crown size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />,
        <>You&apos;ve got {result.days} days of DiplomaPro</>,
        result.extended ? (
          <>They start when your current Pro ends, so it now runs until {longDate(result.expiresAt)}.</>
        ) : (
          <>Pro until {longDate(result.expiresAt)}.</>
        ),
        <Link href={links.practice()} className={primaryBtn}>
          Go to Practice
        </Link>,
      );
  }
}
