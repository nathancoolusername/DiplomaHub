"use server";

import { getCurrentUserId } from "@/app/lib/get-current-user";
import { joinProWaitlist, onProWaitlist } from "@/lib/data";

export type WaitlistResult = { ok: true } | { ok: false; error: string };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Joins the DiplomaPro waitlist: signed-in students need no email, visitors give one. */
export async function joinWaitlistAction(email: string | null, source: string): Promise<WaitlistResult> {
  const signedIn = !!(await getCurrentUserId());
  const clean = (email ?? "").trim();
  if (!signedIn || clean) {
    if (clean.length > 254 || !EMAIL.test(clean)) return { ok: false, error: "Enter a valid email address." };
  }
  try {
    await joinProWaitlist(signedIn && !clean ? null : clean, source.slice(0, 40));
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't add you just now. Try again in a moment." };
  }
}

/** For signed-in students: are they already on the list? (false when signed out or unknown) */
export async function waitlistStatusAction(): Promise<boolean> {
  if (!(await getCurrentUserId())) return false;
  try {
    return await onProWaitlist();
  } catch {
    return false;
  }
}
