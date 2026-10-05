"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Supabase redirects here (not to our /auth routes) when an email link's
// OTP is invalid/expired — e.g. the recovery or signup-confirmation link
// sat unused past its expiry window, or an email security scanner
// pre-opened the link and silently burned the single-use token before the
// real click. Can't tell which of the two flows it was from the error
// alone, so point at both.
//
// Read on the client so the homepage itself can stay static — reading
// searchParams on the server would force a render per request. Must sit
// inside a <Suspense> boundary for the same reason.
export default function LinkExpiredBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("error_code") !== "otp_expired") return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-md py-md text-center">
      <p className="text-sm text-amber-800">
        That link expired or was already used.{" "}
        <Link href="/forgot-password" className="underline font-semibold">
          Request a new password reset
        </Link>
        , or if you were confirming your email, resend it from your{" "}
        <Link href="/profile/edit" className="underline font-semibold">
          profile
        </Link>
        .
      </p>
    </div>
  );
}
