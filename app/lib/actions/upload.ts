"use server";

import { createClient } from "../supabase/server";
import type { ActionResult } from "../types";

// Extension → Content-Type we explicitly set on the storage upload, rather
// than trusting the browser-supplied `file.type` (which the uploader
// controls and can spoof — e.g. naming an SVG-with-embedded-script
// "cover.jpg" but setting type: "image/jpeg" wouldn't help if we blindly
// passed that along; validating the extension and setting our own
// Content-Type means storage always serves what we intended, not what the
// client claimed).
const RESOURCE_FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};
const IMAGE_FILE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const RESOURCE_FILE_MAX_BYTES = 15 * 1024 * 1024;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_MAX_BYTES = 3 * 1024 * 1024;

function validateFile(
  file: File,
  allowedTypes: Record<string, string>,
  maxBytes: number,
): { error: string } | { ext: string; contentType: string } {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const contentType = ext ? allowedTypes[ext] : undefined;
  if (!ext || !contentType) {
    return {
      error: `Unsupported file type — allowed: ${Object.keys(allowedTypes).join(", ")}`,
    };
  }
  if (file.size > maxBytes) {
    return {
      error: `File is too large — max ${Math.floor(maxBytes / (1024 * 1024))}MB`,
    };
  }
  return { ext, contentType };
}

export async function uploadResourceFile(
  file: File,
): Promise<ActionResult<{ fileUrl: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Log in to upload files" };

  const validated = validateFile(file, RESOURCE_FILE_TYPES, RESOURCE_FILE_MAX_BYTES);
  if ("error" in validated) return { success: false, error: validated.error };

  const fileName = `${crypto.randomUUID()}.${validated.ext}`;
  const filePath = `${user.id}/${fileName}`;

  const { error } = await supabase.storage
    .from("resources")
    .upload(filePath, file, { contentType: validated.contentType });
  if (error) return { success: false, error: error.message };

  const { data: urlData } = supabase.storage
    .from("resources")
    .getPublicUrl(filePath);
  return { success: true, data: { fileUrl: urlData.publicUrl } };
}

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
