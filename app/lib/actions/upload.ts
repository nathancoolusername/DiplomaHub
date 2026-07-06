"use server";

import { createClient } from "../supabase/server";
import type { ActionResult } from "../types";

export async function uploadResourceFile(
  file: File,
): Promise<ActionResult<{ fileUrl: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Log in to upload files" };

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  const { error } = await supabase.storage
    .from("resources")
    .upload(filePath, file);
  if (error) return { success: false, error: error.message };

  const { data: urlData } = supabase.storage
    .from("resources")
    .getPublicUrl(filePath);
  return { success: true, data: { fileUrl: urlData.publicUrl } };
}

export async function uploadAvatar(
  file: File,
): Promise<ActionResult<{ avatarUrl: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const fileExt = file.name.split(".").pop();
  const filePath = `${user.id}/avatar.${fileExt}`; // fixed filename — overwrites old avatar automatically

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  // save the URL onto the user's row immediately
  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: urlData.publicUrl })
    .eq("id", user.id);

  if (updateError) return { success: false, error: updateError.message };

  return { success: true, data: { avatarUrl: urlData.publicUrl } };
}
