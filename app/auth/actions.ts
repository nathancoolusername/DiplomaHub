// app/actions.ts
"use server";

import { createClient } from "../lib/supabase/server";
import { createAdminClient } from "../lib/supabase/admin";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { resolveOrigin } from "../lib/resolveOrigin";
import { requireField, requireOneOf } from "../lib/validation";
import { checkRateLimit, getClientIp } from "../lib/ratelimit";
import type { ActionResult } from "../lib/types";

const IB_YEAR_OPTIONS = ["Pre-IB", "DP1", "DP2", "Alumni", "Educator"];

export async function signUp(
  formData: FormData,
): Promise<ActionResult<null> | void> {
  const rateLimit = await checkRateLimit("auth", await getClientIp());
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const supabase = await createClient();

  const displayName = requireField(
    formData.get("display_name"),
    "Display name",
    100,
  );
  if ("error" in displayName) return { success: false, error: displayName.error };

  const ibYear = requireOneOf(
    formData.get("ib_year"),
    "IB year",
    IB_YEAR_OPTIONS,
  );
  if ("error" in ibYear) return { success: false, error: ibYear.error };

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName.value, ib_year: ibYear.value } },
  });

  if (error) return { success: false, error: error.message };
  redirect("/profile/edit");
}

export async function signIn(
  formData: FormData,
): Promise<ActionResult<null> | void> {
  const rateLimit = await checkRateLimit("auth", await getClientIp());
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) return { success: false, error: error.message };
  redirect("/");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = resolveOrigin(await headers());

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) redirect("/login?error=oauth_failed");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  email: string,
): Promise<ActionResult<null>> {
  const rateLimit = await checkRateLimit("auth", await getClientIp());
  if (!rateLimit.allowed) return { success: false, error: rateLimit.error };

  const supabase = await createClient();
  const origin = resolveOrigin(await headers());

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  // Always report success regardless of whether the email is registered —
  // revealing that here would let anyone enumerate real accounts by email.
  if (error) console.error("Password reset request failed:", error.message);
  return { success: true, data: null };
}

export async function updatePassword(
  password: string,
): Promise<ActionResult<null>> {
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: "Reset link expired or invalid — request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// app/actions.ts — add this
export async function resendConfirmation(
  email: string,
): Promise<ActionResult<null>> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}

// Deleting an auth user requires the service-role client — there's no
// client-facing "delete my own account" API on the regular session client.
// The actual cascade (removing all their resources/articles/discussions/
// comments/etc.) happens at the DB level via ON DELETE CASCADE foreign keys,
// not here — see PROJECT_CONTEXT.md's account-deletion section.
export async function deleteAccount(): Promise<ActionResult<null> | void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { success: false, error: error.message };

  await supabase.auth.signOut();
  redirect("/");
}

// app/actions.ts — add this
export async function updateProfile(
  formData: FormData,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const displayName = requireField(
    formData.get("display_name"),
    "Display name",
    100,
  );
  if ("error" in displayName) return { success: false, error: displayName.error };

  const ibYear = requireOneOf(
    formData.get("ib_year"),
    "IB year",
    IB_YEAR_OPTIONS,
  );
  if ("error" in ibYear) return { success: false, error: ibYear.error };

  const { error } = await supabase
    .from("users")
    .update({
      display_name: displayName.value,
      ib_year: ibYear.value,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}
