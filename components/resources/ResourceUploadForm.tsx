// components/ResourceUploadForm.tsx
"use client";

import { useState } from "react";
import { uploadResourceFile } from "@/app/lib/actions/upload";
import { createResource } from "@/app/lib/actions/resources";
import { useRouter } from "next/navigation";

export function ResourceUploadForm() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setUploading(true);
    setError(null);

    const file = formData.get("file") as File;

    let fileUrl = "";
    if (file && file.size > 0) {
      const uploadResult = await uploadResourceFile(file);
      if (!uploadResult.success) {
        setError(uploadResult.error);
        setUploading(false);
        return;
      }
      fileUrl = uploadResult.data.fileUrl;
    }

    formData.set("file_url", fileUrl);

    const result = await createResource(formData);
    if ("error" in result) {
      setError(result.error);
      setUploading(false);
      return;
    }

    router.push("/resources");
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          name="title"
          required
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          className="w-full border rounded-lg px-3 py-2"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <input
            name="subject_tag"
            required
            placeholder="Math AA HL"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <input
            name="type_tag"
            required
            placeholder="Notes"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Year</label>
          <input
            name="year_tag"
            placeholder="2026"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">File</label>
        <input
          type="file"
          name="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={uploading}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Post Resource"}
      </button>
    </form>
  );
}
