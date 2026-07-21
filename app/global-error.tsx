"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Only fires if the root layout itself throws — unlike app/error.tsx, this
// replaces the entire document (Navbar/Footer included), so it has to
// render its own <html>/<body>.
export default function GlobalError({
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
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            textAlign: "center",
            padding: "2rem",
            fontFamily: "sans-serif",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#666", maxWidth: "32rem" }}>
            DiplomaHub hit an unexpected error. Try reloading the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "0.75rem",
              background: "#002c98",
              color: "#fff",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
