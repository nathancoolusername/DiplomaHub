import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { normalizeCode } from "@/lib/codes";

export const metadata: Metadata = { title: "Redeem a code", robots: { index: false } };

// Old share links (/join/ABC234) for any kind of code: they open /codes with
// the code filled in (/codes itself sends signed-out visitors through login
// and back). Redeeming is still the student's click.
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code).trim().toUpperCase();
  if (/^[A-Z0-9]{4}$/.test(normalizeCode(code))) redirect(`/play/deadline/${normalizeCode(code)}`); // a Deadline room
  if (!/^[A-Z0-9]{5,16}$/.test(normalizeCode(code))) redirect("/codes");
  if (!(await getCurrentUserId())) redirect(`/login?next=${encodeURIComponent(`/codes?c=${normalizeCode(code)}`)}`);
  redirect(`/codes?c=${normalizeCode(code)}`);
}
