"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Save } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

const NAME_MAX = 24;

/**
 * "Play as a guest": a name, no email. A Supabase anonymous sign-in, so the
 * game's security (whose turn it is, who's in the room) works as for anyone.
 * Guests only exist in Deadline: the rest of the site treats them as signed out.
 */
export function GuestJoin({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim().replace(/\s+/g, " ");
    if (n.length < 2) return setError("Pick a name (2+ characters).");
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signInAnonymously({ options: { data: { display_name: n, full_name: n } } });
    if (err || !data.user) {
      setBusy(false);
      return setError(/disabled|not enabled/i.test(err?.message ?? "") ? "Guest play isn't switched on yet. Sign up instead (it's free)." : "Couldn't start a guest session. Try again in a moment.");
    }
    // The signup trigger may not copy the name: set it on the guest's own profile row.
    await supabase.from("users").update({ display_name: n }).eq("id", data.user.id);
    router.refresh();
  }

  return (
    <form onSubmit={join} className={`flex flex-col gap-xs ${className}`}>
      <label htmlFor="dl-guest-name" className="text-label-md font-semibold text-on-surface-variant">Or play as a guest, no account</label>
      <div className="flex gap-xs">
        <input id="dl-guest-name" value={name} onChange={(e) => { setName(e.target.value.slice(0, NAME_MAX)); setError(null); }}
          placeholder="Your name" autoComplete="nickname" maxLength={NAME_MAX}
          className="flex-1 min-w-0 rounded-2xl border border-outline-variant bg-surface-container-lowest px-md py-sm text-body-lg text-on-surface outline-none focus:border-primary" />
        <button type="submit" disabled={busy || name.trim().length < 2}
          className="inline-flex items-center gap-xs rounded-2xl bg-inverse-surface text-inverse-on-surface px-md py-sm font-semibold disabled:opacity-50 cursor-pointer">
          {busy ? "Joining…" : "Play"} <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
      {error && <p className="text-label-md text-error" role="alert">{error}</p>}
      <p className="text-label-sm text-on-surface-variant">Guests can play and chat. Make an account any time to keep your wins.</p>
    </form>
  );
}

/**
 * For a guest: "Keep your wins" goes to the sign-up page, which turns the
 * guest into an account (same id, so every game and win stays theirs) and
 * then comes back to `next`.
 */
export function GuestUpgrade({ next, className = "" }: { next: string; className?: string }) {
  return (
    <Link href={`/signup?next=${encodeURIComponent(next)}`}
      className={`group flex items-center gap-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-md text-left hover:border-primary ${className}`}>
      <span className="w-10 h-10 shrink-0 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center" aria-hidden="true"><Save size={18} /></span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-on-surface group-hover:text-primary">Keep your wins: sign up free</span>
        <span className="block text-label-md text-on-surface-variant">You&apos;re playing as a guest. Sign up and your games and wins come with you, and you can make rooms.</span>
      </span>
      <ArrowRight size={18} className="text-on-surface-variant" aria-hidden="true" />
    </Link>
  );
}
