"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-margin py-20 px-md text-center min-h-[60vh]">
      <AlertTriangle size={48} className="text-primary" />
      <h1 className="text-headline-lg font-serif font-bold">
        Something went wrong
      </h1>
      <p className="text-on-surface-variant text-body-lg max-w-150">
        We hit an unexpected error loading this page. Try again, or head back
        home.
      </p>
      <div className="flex flex-row gap-md">
        <button
          onClick={reset}
          className="px-lg py-sm bg-primary text-on-primary rounded-xl font-semibold cursor-pointer hover:opacity-90 transition"
        >
          Try again
        </button>
        <Link href="/">
          <button className="px-lg py-sm border-1 border-outline-variant rounded-xl font-semibold cursor-pointer hover:bg-surface-container transition">
            Go home
          </button>
        </Link>
      </div>
    </div>
  );
}
