// components/login/LoginForm.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn, signInWithGoogle } from "@/app/auth/actions";
import { Eye } from "lucide-react";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("password");
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
    setLoading(true);
    setError(null);
    const result = await signIn(formData);
    if (result && !result.success) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="w-full justify-content-center items-center py-20 px-md bg-surface-container h-full flex flex-col gap-margin">
      <Link href="/">
        <span className="font-serif text-display-lg self-center justify-center font-bold flex flex-row">
          Diploma<h1 className="text-primary">Hub</h1>
        </span>
      </Link>
      <div className="bg-surface-container-lowest p-margin border-1 border-outline-variant rounded-xl flex flex-col gap-margin w-full max-w-120">
        <h1 className="text-headline-lg font-semibold font-serif">Log in</h1>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-body-lg font-medium mb-1">
              Email Adress
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-body-lg font-medium mb-1">
              Password
            </label>
            <div className="flex flex-row gap-sm">
              <input
                name="password"
                type={type}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
              <button type="button" onClick={handleToggle}>
                <Eye
                  className={`cursor-pointer ${icon ? "" : "text-primary"}`}
                />
              </button>
            </div>
            <Link
              href="/forgot-password"
              className="text-primary hover:underline text-label-md"
            >
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-primary text-white font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 cursor-pointer"
          >
            Continue with Google
          </button>
        </form>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex flex-col gap-sm">
          <h1 className="text-on-surface-variant">New to the community?</h1>
          <Link href={"/signup"}>
            <button className="w-full py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 cursor-pointer">
              Sign up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
