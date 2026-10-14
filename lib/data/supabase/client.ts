import "server-only";

import { cache } from "react";
import { createClient } from "@/app/lib/supabase/server";
import { getCurrentUserId } from "@/app/lib/get-current-user";

// One Supabase client per request, acting as the signed-in student (their
// JWT from cookies), so RLS and the RPCs' auth.uid() checks apply.
export const db = cache(async () => createClient());

export class NotSignedInError extends Error {
  constructor() {
    super("Not signed in");
    this.name = "NotSignedInError";
  }
}

/** The signed-in user's id (verified by proxy.ts), or NotSignedInError. */
export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new NotSignedInError();
  return id;
}

export function check(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/** Calls a database function; its own error messages ("Set not found" …) pass through. */
export async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await (await db()).rpc(fn, args);
  check(error);
  return data as T;
}
