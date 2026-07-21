import type { MetadataRoute } from "next";

// www is the canonical domain — apex 308-redirects to it (see
// PROJECT_CONTEXT.md's "Deployment & Google OAuth verification" section).
const BASE_URL = "https://www.diplomahub.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/profile/edit",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
        "/auth",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
