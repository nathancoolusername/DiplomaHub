// app/signup/page.tsx
"use client";
import { use, useEffect, useState, FormEvent } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { signUp } from "../auth/actions";
import { Eye } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Spinner } from "@/components/spinner";
import { isSafeNext } from "@/app/lib/isSafeNext";

export default function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  // Where to go after signing up (a shared code link keeps its code this way).
  const next = isSafeNext(use(searchParams).next);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("password");
  // A Deadline guest signing up keeps their games: say so, and start from their guest name.
  const [guestName, setGuestName] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    createClient().auth.getSession().then(({ data: { session } }) => {
      if (!cancelled && session?.user.is_anonymous) setGuestName(String(session.user.user_metadata?.display_name ?? ""));
    });
    return () => { cancelled = true; };
  }, []);
  const [icon, setIcon] = useState(false);
  const handleToggle = () => {
    if (type === "password") {
      setIcon(false);
      setType("text");
    } else {
      setIcon(true);
      setType("password");
    }
  };

  async function handleSubmit(formData: FormData) {
    setError(null);

    const password = formData.get("password") as string;
    const confirm = formData.get("confirm_password") as string;
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    const result = await signUp(formData);
    if (result && !result.success) {
      setError(result.error);
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSubmit(new FormData(e.currentTarget));
  }

  return (
    <div className="py-20 px-md bg-surface-container h-full flex flex-col gap-margin items-center">
      <div className="w-full max-w-140 flex flex-col gap-gutter bg-surface-container-lowest p-margin rounded-xl border-1 border-outline-variant">
        <Logo size="lg" prefix="Join " />
        <h1 className="text-headline-lg font-semibold font-serif">Sign up</h1>
        {guestName !== null && (
          <p className="rounded-lg bg-primary/10 px-md py-sm text-body-md text-on-surface">
            You&apos;ve been playing Deadline as a guest. Sign up here and your games and wins come with you.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {next && <input type="hidden" name="next" value={next} />}
          <div>
            <label className="block text-body-lg font-bold mb-1">
              Display name
            </label>
            <input
              key={guestName ?? "new"}
              name="display_name"
              required
              defaultValue={guestName ?? undefined}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-body-lg font-bold mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-body-lg font-bold mb-1">
              Password
            </label>
            <div className="flex flex-row gap-sm">
              <input
                name="password"
                type={type}
                required
                minLength={6}
                className="flex-1 min-w-0 border rounded-lg px-3 py-2"
              />
              <button type="button" onClick={handleToggle}>
                <Eye
                  className={`cursor-pointer ${icon ? "" : "text-primary"}`}
                />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-body-lg font-bold mb-1">
              Confirm password
            </label>
            <input
              name="confirm_password"
              type={type}
              required
              minLength={6}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-body-lg font-bold mb-1">
              I am a...
            </label>
            <select
              name="ib_year"
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select one</option>
              <option value="Pre-IB">Pre-IB</option>
              <option value="DP1">DP1</option>
              <option value="DP2">DP2</option>
              <option value="Alumni">Alumni</option>
              <option value="Educator">Educator</option>
            </select>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-primary cursor-pointer text-on-primary font-medium hover:bg-primary/90 disabled:opacity-50 inline-flex items-center justify-center gap-sm"
          >
            {loading && <Spinner size={16} />}
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-center text-on-surface-variant">
          Already have an account?{" "}
          <a href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-primary hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
