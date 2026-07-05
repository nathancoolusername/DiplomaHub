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
