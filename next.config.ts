// next.config.js
/** @type {import('next').NextConfig} */
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
};

module.exports = nextConfig;
