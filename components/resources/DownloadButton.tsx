// components/DownloadButton.tsx
"use client";
import { Download } from "lucide-react";
import Button from "../button";
import { useState } from "react";
import { downloadResource } from "@/app/lib/actions/resources";

export function DownloadButton({ resourceId }: { resourceId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    const result = await downloadResource(resourceId);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // TypeScript now knows result.data exists and is { fileUrl: string }
    const link = document.createElement("a");
    link.href = result.data.fileUrl;

    link.download = "";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity cursor-pointer flex flex-row gap-sm ${className} px-lg py-sm disabled:opacity-50"
      >
        {" "}
        <Download />
        {loading ? "Downloading..." : "Download"}
      </button>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
