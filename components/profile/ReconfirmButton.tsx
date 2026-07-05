// components/ResendConfirmationButton.tsx
"use client";

import { useState } from "react";
import { resendConfirmation } from "@/app/auth/actions";

export function ResendConfirmationButton({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    const result = await resendConfirmation(email);
    setLoading(false);
    if (result.success) setSent(true);
  }

  return (
    <button
      onClick={handleResend}
      disabled={loading || sent}
      className="text-sm font-medium text-amber-800 underline disabled:opacity-50"
    >
      {sent ? "Sent!" : loading ? "Sending..." : "Resend email"}
    </button>
  );
}
