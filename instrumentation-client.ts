import * as Sentry from "@sentry/nextjs";

// No-ops if NEXT_PUBLIC_SENTRY_DSN isn't set — same pattern as the
// Resend/Upstash integrations elsewhere in this project.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
