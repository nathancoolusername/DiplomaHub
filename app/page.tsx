import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import SignedOutHome from "@/components/home/signed-out-home";
import SignedInHome from "@/components/home/signed-in-home";

const description =
  "Browse IA and EE exemplars, guides, and notes for every subject, and plan every deadline with the Hub — DiplomaHub's personal calendar for the IB Diploma.";

export const metadata: Metadata = {
  title: "DiplomaHub – IB resources and diploma planner",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title: "DiplomaHub – IB resources and diploma planner",
    description,
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error_code?: string }>;
}) {
  const userId = await getCurrentUserId();

  // Supabase redirects here (not to our /auth routes) when an email link's
  // OTP is invalid/expired — e.g. the recovery or signup-confirmation link
  // sat unused past its expiry window, or an email security scanner
  // pre-opened the link and silently burned the single-use token before the
  // real click. Can't tell which of the two flows it was from the error
  // alone, so point at both.
  const { error_code } = await searchParams;
  const linkExpired = error_code === "otp_expired";

  return (
    <div className="flex flex-col">
      {linkExpired && (
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
      )}
      {userId ? <SignedInHome /> : <SignedOutHome />}
    </div>
  );
}
