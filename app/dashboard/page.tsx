import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import SignedInHome from "@/components/home/signed-in-home";
import LinkExpiredBanner from "@/components/home/link-expired-banner";
import { homeMetadata } from "@/components/home/home-metadata";

export const metadata = homeMetadata;

// The signed-in homepage. Never visited at this URL: proxy.ts rewrites `/`
// here for verified sessions (the browser still shows `/`) and redirects
// direct requests for `/dashboard` back to `/`. Kept separate from
// app/page.tsx so the signed-out homepage can stay static.
export default async function Dashboard() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/");

  return (
    <div className="flex flex-col">
      <Suspense fallback={null}>
        <LinkExpiredBanner />
      </Suspense>
      <SignedInHome />
    </div>
  );
}
