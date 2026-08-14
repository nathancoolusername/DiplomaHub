// components/DownloadButton.tsx
"use client";
import { Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { downloadResource } from "@/app/lib/actions/resources";
import { LOGIN_REQUIRED_TO_DOWNLOAD } from "@/app/lib/authMessages";

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
  kind = "file",
}: {
  resourceId: string;
  fileName?: string;
  kind?: "file" | "link";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const isExternalLink = kind === "link";

  async function handleDownload() {
    setLoading(true);
    setError(null);

    // Safari (and strict popup blockers generally) only treats window.open()
    // as a trusted, user-initiated action if it's called synchronously
    // inside the click handler — once we `await` the server action below,
    // the async gap makes it look like an unrequested popup and it gets
    // blocked. Opening a blank tab right now, before the await, and
    // redirecting it once we know the real URL keeps it inside that
    // trusted window instead.
    const newTab = isExternalLink ? window.open("", "_blank") : null;

    const result = await downloadResource(resourceId, kind);

    if (!result.success) {
      newTab?.close();
      if (result.error === LOGIN_REQUIRED_TO_DOWNLOAD) {
        setShowLoginPrompt(true);
        setTimeout(() => setShowLoginPrompt(false), 3000);
      } else {
        setError(result.error);
      }
      setLoading(false);
      return;
    }

    if (isExternalLink) {
      // External links can't be fetched cross-origin (CORS) and shouldn't
      // be force-downloaded anyway — just open them like a normal link.
      if (newTab) {
        newTab.location.href = result.data.fileUrl;
      } else {
        // Popup blocked even for the synchronous open (e.g. popups disabled
        // site-wide) — fall back to same-tab navigation rather than a dead end.
        window.location.href = result.data.fileUrl;
      }
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
    <div className="relative inline-block">
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
      {showLoginPrompt &&
        createPortal(
          // Portaled to <body> (not positioned relative to the button) so it
          // can't be clipped by a resource card's overflow-hidden — cards on
          // the grid pages crop anything that pokes past their rounded edge.
          <Link
            href="/login"
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 whitespace-nowrap bg-red-50 text-red-700 border border-red-200 text-label-md font-semibold px-lg py-sm rounded-full shadow-lg hover:underline"
          >
            {LOGIN_REQUIRED_TO_DOWNLOAD}
          </Link>,
          document.body,
        )}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
