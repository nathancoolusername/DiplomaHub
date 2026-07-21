// next.config.js
/** @type {import('next').NextConfig} */

// No nonce-based CSP here on purpose: nonces require every page to render
// dynamically (Next.js docs — "all pages must be dynamically rendered"),
// which would kill static optimization/ISR for the whole content-heavy
// site (resources/articles/community listings). Using the documented
// "without nonces" fixed-header approach instead — 'unsafe-inline' is
// needed because likeButton.tsx/saveButton.tsx set liked/saved color via
// inline `style` (Tailwind class-order made a plain class unreliable
// there — see PROJECT_CONTEXT.md), and Next injects inline hydration
// scripts. Still meaningfully blocks loading scripts from attacker-
// controlled external origins, restricts framing, form-action, etc.
const isDev = process.env.NODE_ENV === "development";
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://gmfqdkbghbxdlxffwfca.supabase.co;
  font-src 'self';
  connect-src 'self' https://gmfqdkbghbxdlxffwfca.supabase.co https://*.ingest.de.sentry.io https://*.ingest.sentry.io https://*.sentry.io;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gmfqdkbghbxdlxffwfca.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
      // VS Code's port-forwarding ("Ports" tab) injects an
      // `x-forwarded-host` of the *.devtunnels.ms tunnel domain on EVERY
      // request through the forwarded port — including ones loaded via
      // plain localhost — while the browser's real `Origin` header stays
      // whatever host the page was actually opened from. Both sides need
      // to be allowed or Server Actions get rejected with
      // "Invalid Server Actions request."
      allowedOrigins: ["**.devtunnels.ms", "localhost:3000"],
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
