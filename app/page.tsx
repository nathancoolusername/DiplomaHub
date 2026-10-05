import { Suspense } from "react";
import SignedOutHome from "@/components/home/signed-out-home";
import LinkExpiredBanner from "@/components/home/link-expired-banner";
import { homeMetadata } from "@/components/home/home-metadata";

export const metadata = homeMetadata;

// The signed-out homepage is the same for every visitor, so it's ISR and
// served from Vercel's CDN. Its data is cached under the "resources" tag, so
// revalidateTag("resources") refreshes it early; this is only a backstop.
// Signed-in visitors never get this page: proxy.ts rewrites `/` to
// `/dashboard` for them. Don't read cookies/headers/searchParams here, or
// the page turns dynamic again and every visit costs a function invocation.
export const revalidate = 3600;

export default function Home() {
  return (
    <div className="flex flex-col">
      <Suspense fallback={null}>
        <LinkExpiredBanner />
      </Suspense>
      <SignedOutHome />
    </div>
  );
}
