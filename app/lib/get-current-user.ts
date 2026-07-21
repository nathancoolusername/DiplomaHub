// lib/get-current-user.ts
import { createClient } from "@/app/lib/supabase/server";
import { cache } from "react";
import type { UserProfile } from "@/app/lib/types";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentUserProfile = cache(
  async (): Promise<UserProfile | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return profile;
  },
);
