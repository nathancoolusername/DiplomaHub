import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserId } from "@/app/lib/get-current-user";

export const metadata: Metadata = { title: "Join a set", robots: { index: false } };

// A shared set's link: /join/ABC234. Outside /practice on purpose, so a
// signed-out visitor keeps the code through login (the Practice layout's own
// redirect can't see query strings). Signed in, it opens Practice with the
// code filled in; adding the set is still the student's click.
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code).trim().toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) redirect("/practice");
  if (!(await getCurrentUserId())) redirect(`/login?next=${encodeURIComponent(`/join/${code}`)}`);
  redirect(`/practice?code=${code}`);
}
