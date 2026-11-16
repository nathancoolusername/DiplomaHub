import { headers } from "next/headers";
import type { Metadata } from "next";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { isAdmin } from "@/app/lib/admin";
import { getMyCodes, getSharingStats } from "@/lib/data";
import { formatCode, normalizeCode } from "@/lib/codes";
import { RedeemBox } from "@/components/codes/RedeemBox";
import { ShareableTypes } from "@/components/codes/ShareableTypes";
import { MyCodesList } from "@/components/codes/MyCodesList";
import { CodesLanding } from "@/components/codes/CodesLanding";
import { SharingReward } from "@/components/codes/SharingReward";

type Props = { searchParams: Promise<{ c?: string }> };

function codeFrom(raw: unknown): string {
  return typeof raw === "string" ? normalizeCode(raw).slice(0, 16) : "";
}

// A shared link unfurls as a card with the code on it (app/codes/og). Never
// indexed: codes are for the people they're sent to.
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const code = codeFrom((await searchParams).c);
  const title = code ? `Code ${formatCode(code)}` : "Codes";
  const description = code
    ? "Someone shared a practice set or study plan with you on DiplomaHub. Open the link to add it to your account."
    : "Share practice sets, Hub items and whole revision plans with one short code.";
  const image = { url: `/codes/og${code ? `?c=${code}` : ""}`, width: 1200, height: 630, alt: code ? `DiplomaHub code ${formatCode(code)}` : "DiplomaHub codes" };
  return {
    title,
    description,
    robots: { index: false },
    alternates: { canonical: "/codes" },
    openGraph: { title: `${title} · DiplomaHub`, description, url: code ? `/codes?c=${code}` : "/codes", images: [image] },
    twitter: { card: "summary_large_image", title: `${title} · DiplomaHub`, description, images: [image.url] },
  };
}

// Codes: redeem any code (top), the sharing reward, what can be shared, and
// the codes you've made. Signed-out visitors (usually a friend who opened a
// shared link) get a landing page that signs them up with the code kept.
export default async function CodesPage({ searchParams }: Props) {
  const code = codeFrom((await searchParams).c);
  const userId = await getCurrentUserId();
  if (!userId) return <CodesLanding code={code} />;

  const [codes, stats, h] = await Promise.all([getMyCodes(), getSharingStats(), headers()]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "diplomahub.com";
  const origin = `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
  // Server components render once per request: a fixed "now" keeps statuses stable.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-xl">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Codes</h1>
        <p className="text-body-lg text-on-surface-variant">Redeem a code someone gave you, or see the ones you&apos;ve shared.</p>
      </header>

      <RedeemBox initialCode={code} />

      {stats && <SharingReward stats={stats} isUnlimited={isAdmin(userId)} />}

      <section className="flex flex-col gap-md" aria-labelledby="shareable">
        <h2 id="shareable" className="font-serif font-bold text-headline-md text-on-surface">
          What you can share
        </h2>
        <ShareableTypes />
      </section>

      <section className="flex flex-col gap-md" aria-labelledby="my-codes">
        <div className="flex items-end justify-between gap-md">
          <h2 id="my-codes" className="font-serif font-bold text-headline-md text-on-surface">
            My codes
          </h2>
          {codes.length > 0 && (
            <p className="text-label-md text-on-surface-variant tabular-nums">
              {codes.reduce((n, c) => n + c.useCount, 0)} uses in total
            </p>
          )}
        </div>
        <MyCodesList codes={codes} origin={origin} now={now} />
      </section>
    </div>
  );
}
