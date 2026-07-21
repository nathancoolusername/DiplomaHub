"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "@/app/auth/actions";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    await requestPasswordReset(formData.get("email") as string);
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <div className="w-full justify-content-center items-center py-20 px-md bg-surface-container h-full flex flex-col gap-margin">
      <Link href="/">
        <span className="font-serif text-display-lg self-center justify-center font-bold flex flex-row">
          Diploma<h1 className="text-primary">Hub</h1>
        </span>
      </Link>
      <div className="bg-surface-container-lowest p-margin border-1 border-outline-variant rounded-xl flex flex-col gap-margin w-full max-w-120">
        <h1 className="text-headline-lg font-semibold font-serif">
          Reset your password
        </h1>

        {submitted ? (
          <p className="text-body-lg text-on-surface-variant">
            If an account exists for {email || "that email"}, we&apos;ve sent
            a link to reset your password. Check your inbox.
          </p>
        ) : (
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-body-lg font-medium mb-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-primary text-white font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <Link href="/login" className="text-primary hover:underline text-body-md">
          Back to log in
        </Link>
      </div>
    </div>
  );
}
