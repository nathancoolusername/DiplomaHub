// lib/get-current-user.ts
import { headers } from "next/headers";
import { createClient } from "@/app/lib/supabase/server";
import { cache } from "react";
import type { UserProfile } from "@/app/lib/types";

// proxy.ts (the middleware) already validates the session against Supabase's
// Auth server on every matched request and forwards the result via this
// header — reading it here is free (no network call), unlike getCurrentUser()
// below. Use this whenever only the id (or just "is someone logged in?") is
// needed, which covers nearly every call site in the app.
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const headersList = await headers();
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
