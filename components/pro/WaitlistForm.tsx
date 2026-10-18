"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { joinWaitlistAction, waitlistStatusAction } from "@/app/pro/actions";
import { useViewerPrefs } from "@/components/shared/use-is-pro";
import { Spinner } from "@/components/spinner";

/**
 * The DiplomaPro waitlist. Signed-in students join with one click (their
 * account email is used); visitors type an email.
 */
export function WaitlistForm({ source = "pro-page" }: { source?: string }) {
  const prefs = useViewerPrefs();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!prefs?.signedIn) return;
    let live = true;
    void waitlistStatusAction().then((on) => live && on && setJoined(true));
    return () => {
      live = false;
    };
  }, [prefs?.signedIn]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await joinWaitlistAction(prefs?.signedIn ? null : email, source);
    setBusy(false);
    if (res.ok) setJoined(true);
    else setError(res.error);
  };

  if (joined) {
    return (
      <p role="status" className="inline-flex items-center gap-sm rounded-xl bg-secondary-container text-on-secondary-container px-lg py-md font-semibold">
        <Check size={18} aria-hidden="true" /> You&apos;re on the list. We&apos;ll email you when DiplomaPro opens.
      </p>
    );
  }

  const signedIn = prefs?.signedIn === true;
  return (
    <form onSubmit={submit} className="flex flex-col gap-xs w-full max-w-140">
      <div className="flex flex-col sm:flex-row sm:items-center gap-sm">
        {signedIn ? (
          <p className="flex-1 text-body-md text-on-surface-variant">We&apos;ll use the email on your account.</p>
        ) : (
          <>
            <label htmlFor="waitlist-email" className="sr-only">
              Email
            </label>
            <input
              id="waitlist-email"
              type="email"
              required
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 min-w-0 rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-md text-on-surface focus:outline-2 focus:outline-primary"
            />
          </>
        )}
        <button
          type="submit"
          disabled={busy || prefs === null}
          className="inline-flex items-center justify-center gap-xs shrink-0 rounded-lg bg-primary text-on-primary px-lg py-sm text-label-md font-bold hover:opacity-90 disabled:opacity-60 cursor-pointer"
        >
          {busy && <Spinner size={14} />}
                {busy ? "Joining…" : "Join the waitlist"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-label-md text-error">
          {error}
        </p>
      )}
      <p className="text-label-sm text-on-surface-variant">One email when it opens. No spam, and no payment details.</p>
    </form>
  );
}
