import "server-only";

import { rpc } from "./client";

// The DiplomaPro waitlist (migration 17). Anyone can join through the
// database function; the table itself is closed.

/** Joins the waitlist. Signed in, `email` can be omitted: the account email is used. */
export async function joinProWaitlist(email: string | null, source: string | null): Promise<void> {
  await rpc("join_pro_waitlist", { p_email: email, p_source: source });
}

/** Whether the signed-in student is on the waitlist. */
export async function onProWaitlist(): Promise<boolean> {
  return rpc<boolean>("on_pro_waitlist");
}
