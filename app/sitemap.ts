import type { MetadataRoute } from "next";
import { createClient } from "@/app/lib/supabase/server";

// www is the canonical domain — apex 308-redirects to it (see
// PROJECT_CONTEXT.md's "Deployment & Google OAuth verification" section).
const BASE_URL = "https://www.diplomahub.org";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: resources }, { data: articles }, { data: discussions }] =
    await Promise.all([
      supabase
        .from("resources")
        .select("id, created_at")
        .eq("published", true),
      supabase
        .from("articles")
        .select("slug, created_at")
        .eq("published", true),
      supabase.from("discussions").select("id, created_at"),
    ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/resources`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/articles`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/community`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/roadmap`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${BASE_URL}/legal/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/legal/terms-of-service`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/legal/impressum`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const resourceRoutes: MetadataRoute.Sitemap = (resources ?? []).map(
    (r) => ({
      url: `${BASE_URL}/resources/${r.id}`,
      lastModified: r.created_at,
      changeFrequency: "monthly",
      priority: 0.6,
    }),
  );

  const articleRoutes: MetadataRoute.Sitemap = (articles ?? []).map((a) => ({
    url: `${BASE_URL}/articles/${a.slug}`,
    lastModified: a.created_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const discussionRoutes: MetadataRoute.Sitemap = (discussions ?? []).map(
    (d) => ({
      url: `${BASE_URL}/community/${d.id}`,
      lastModified: d.created_at,
      changeFrequency: "weekly",
      priority: 0.4,
    }),
  );

  return [...staticRoutes, ...resourceRoutes, ...articleRoutes, ...discussionRoutes];
}
