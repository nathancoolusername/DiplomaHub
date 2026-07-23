"use server";

import { createClient } from "../supabase/server";
import type { ActionResult } from "../types";
import {
  validateFile,
  IMAGE_FILE_TYPES,
  IMAGE_MAX_BYTES,
  AVATAR_MAX_BYTES,
} from "../uploadValidation";

// Resource files upload directly from the browser to Supabase Storage
// instead of going through a server action — see UploadResourceForm.tsx for
// why (Vercel's serverless function payload limit rejects anything above
// ~4.5MB before it reaches Next, regardless of next.config's
// serverActions.bodySizeLimit, which only governs self-hosted Next).
// Article covers/avatars stay well under that limit (5MB/3MB caps), so they
// keep going through server actions here.

export async function uploadArticleCoverImage(
  file: File,
): Promise<ActionResult<{ coverImageUrl: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Log in to upload files" };

  const validated = validateFile(file, IMAGE_FILE_TYPES, IMAGE_MAX_BYTES);
  if ("error" in validated) return { success: false, error: validated.error };

  const fileName = `${crypto.randomUUID()}.${validated.ext}`;
  const filePath = `${user.id}/${fileName}`;

  const { error } = await supabase.storage
    .from("article-covers")
    .upload(filePath, file, { contentType: validated.contentType });
  if (error) return { success: false, error: error.message };

  const { data: urlData } = supabase.storage
    .from("article-covers")
    .getPublicUrl(filePath);
  return { success: true, data: { coverImageUrl: urlData.publicUrl } };
}

export async function uploadAvatar(
  file: File,
): Promise<ActionResult<{ avatarUrl: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not logged in" };

  const validated = validateFile(file, IMAGE_FILE_TYPES, AVATAR_MAX_BYTES);
  if ("error" in validated) return { success: false, error: validated.error };

  const filePath = `${user.id}/avatar.${validated.ext}`; // fixed filename — overwrites old avatar automatically

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {
      upsert: true,
      contentType: validated.contentType,
    });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  // The filename is fixed (upsert overwrites in place), so the URL never
  // changes across re-uploads — append a cache-busting query param or every
  // browser/CDN/Next Image cache just keeps serving the old bytes.
  const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  // save the URL onto the user's row immediately
  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) return { success: false, error: updateError.message };

  return { success: true, data: { avatarUrl } };
}
