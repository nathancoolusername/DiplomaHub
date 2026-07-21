// components/DownloadButton.tsx
"use client";
import { Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { downloadResource } from "@/app/lib/actions/resources";

function getFileNameFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    return decodeURIComponent(pathname.split("/").pop() || "download");
  } catch {
    return "download";
  }
}

function getExtensionFromUrl(url: string) {
  const name = getFileNameFromUrl(url);
  const dot = name.lastIndexOf(".");
  return dot > -1 ? name.slice(dot) : "";
}

function sanitizeFileName(name: string) {
  return name.replace(/[\\/:*?"<>|]+/g, "-").trim();
}

export function DownloadButton({
  resourceId,
  fileName,
  isExternalLink = false,
}: {
  resourceId: string;
  fileName?: string;
  isExternalLink?: boolean;
}) {
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

    if (isExternalLink) {
      // External links can't be fetched cross-origin (CORS) and shouldn't
      // be force-downloaded anyway — just open them like a normal link.
      window.open(result.data.fileUrl, "_blank", "noopener,noreferrer");
      setLoading(false);
      return;
    }

    try {
      // Fetching the file into a blob keeps the download same-origin so the
      // browser saves it directly instead of navigating to the storage URL.
      const response = await fetch(result.data.fileUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName
        ? `${sanitizeFileName(fileName)}${getExtensionFromUrl(result.data.fileUrl)}`
        : getFileNameFromUrl(result.data.fileUrl);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError("Failed to download file");
    }

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
        {isExternalLink ? <ExternalLink /> : <Download />}
        {loading
          ? isExternalLink
            ? "Opening..."
            : "Downloading..."
          : isExternalLink
            ? "Visit Link"
            : "Download"}
      </button>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
