"use client";

import { useState } from "react";
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
 * For a guest: turn the guest session into a real account (email and
 * password). Same user id, so every game and win so far stays theirs.
 */
export function GuestUpgrade({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setMsg({ ok: false, text: "Use a password of 8+ characters." });
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      return setMsg({ ok: false, text: /already|registered|exists/i.test(error.message) ? "That email already has an account. Log in instead (this guest's wins stay with the guest)." : error.message });
    }
    await supabase.auth.refreshSession();
    setBusy(false);
    if (data.user?.email) {
      setMsg({ ok: true, text: "Saved! Your games and wins are on your new account." });
      router.refresh();
    } else {
      setMsg({ ok: true, text: "Check your email to confirm, and your account is ready with your wins." });
    }
  }

  return (
    <form onSubmit={save} className={`flex flex-col gap-xs rounded-2xl border border-outline-variant bg-surface-container-lowest p-md text-left ${className}`}>
      <p className="font-semibold text-on-surface inline-flex items-center gap-xs"><Save size={16} className="text-primary" aria-hidden="true" />Keep your wins</p>
      {!compact && <p className="text-label-md text-on-surface-variant">You&apos;re playing as a guest. Add an email and password to turn this into a free account: your games and wins come with you, and you can make rooms.</p>}
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-xs">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" aria-label="Email"
          className="min-w-0 rounded-xl border border-outline-variant bg-surface-container-lowest px-sm py-xs text-body-md text-on-surface outline-none focus:border-primary" />
        <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+)" autoComplete="new-password" aria-label="Password"
          className="min-w-0 rounded-xl border border-outline-variant bg-surface-container-lowest px-sm py-xs text-body-md text-on-surface outline-none focus:border-primary" />
        <button type="submit" disabled={busy} className="rounded-xl bg-primary text-on-primary px-md py-xs text-label-md font-semibold disabled:opacity-50 cursor-pointer">
          {busy ? "Saving…" : "Make my account"}
        </button>
      </div>
      {msg && <p className={`text-label-md ${msg.ok ? "text-primary" : "text-error"}`} role="status">{msg.text}</p>}
    </form>
  );
}
