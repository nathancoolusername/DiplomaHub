// app/actions.ts
"use server";

import { createClient } from "../lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { resolveOrigin } from "../lib/resolveOrigin";
import type { ActionResult } from "../lib/types";

export async function signUp(
  formData: FormData,
): Promise<ActionResult<null> | void> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const display_name = formData.get("display_name") as string;
  const ib_year = formData.get("ib_year") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name, ib_year: ib_year || null } },
  });

  if (error) return { success: false, error: error.message };
  redirect("/profile/edit");
}

export async function signIn(
  formData: FormData,
): Promise<ActionResult<null> | void> {
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

// app/actions.ts — add this
export async function updateProfile(
  formData: FormData,
): Promise<ActionResult<null>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const { error } = await supabase
    .from("users")
    .update({
      display_name: formData.get("display_name") as string,
      ib_year: formData.get("ib_year") as string,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true, data: null };
}
