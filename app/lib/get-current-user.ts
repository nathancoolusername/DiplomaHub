// lib/get-current-user.ts
import { cookies, headers } from "next/headers";
import { createClient } from "@/app/lib/supabase/server";
import { cache } from "react";
import type { UserProfile } from "@/app/lib/types";

// proxy.ts (the middleware) already validates the session against Supabase's
// Auth server on every matched request and forwards the result via this
// header — reading it here is free (no network call), unlike getCurrentUser()
// below. Use this whenever only the id (or just "is someone logged in?") is
// needed, which covers nearly every call site in the app.
//
// proxy.ts only runs (and overwrites the header) when a Supabase auth cookie
// is present — its matcher skips everything else so logged-out visitors and
// bots cost no proxy invocation. On those skipped requests nothing strips a
// client-sent header, so it's only trusted when the cookie is there too. Keep
// the cookie names in sync with the matcher. (Prefetches do run the proxy,
// which strips the header for them; the check below is belt and braces.)
const AUTH_COOKIES = [
  "sb-gmfqdkbghbxdlxffwfca-auth-token",
  "sb-gmfqdkbghbxdlxffwfca-auth-token.0",
];

export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const [headersList, cookieStore] = await Promise.all([headers(), cookies()]);
  if (headersList.has("next-router-prefetch")) return null;
  if (!AUTH_COOKIES.some((name) => cookieStore.has(name))) return null;
  return headersList.get("x-verified-user-id");
});

// Full Supabase user object (email_confirmed_at, etc.) — this does its own
// network round-trip to Supabase's Auth server, on top of the one proxy.ts
// already did. Only use this where more than the id is actually needed.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentUserProfile = cache(
  async (): Promise<UserProfile | null> => {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    return profile;
  },
);
