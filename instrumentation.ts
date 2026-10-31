import * as Sentry from "@sentry/nextjs";

// Errors only on the server. Leaving out tracesSampleRate turns tracing off
// completely; any value (even 0) switches Sentry's per-request span
// instrumentation on, which was a noticeable share of Vercel Active CPU.
// Browser tracing (instrumentation-client.ts) runs on the visitor's machine
// and costs nothing here.
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" ||
    process.env.NEXT_RUNTIME === "edge"
  ) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
