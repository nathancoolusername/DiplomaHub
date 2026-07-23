// Shared between the server actions in actions/upload.ts (avatar/cover
// images) and the client-side resource upload in UploadResourceForm.tsx
// (resource files upload straight from the browser to Supabase Storage,
// bypassing Server Actions — see UploadResourceForm.tsx for why).
export const RESOURCE_FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};
export const IMAGE_FILE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export const RESOURCE_FILE_MAX_BYTES = 15 * 1024 * 1024;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_MAX_BYTES = 3 * 1024 * 1024;

export function validateFile(
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
