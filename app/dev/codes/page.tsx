import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { MyCode } from "@/lib/data";
import type { RedeemFailReason, RedeemResult } from "@/lib/codes";
import { RedeemBox, Outcome } from "@/components/codes/RedeemBox";
import { ShareableTypes } from "@/components/codes/ShareableTypes";
import { MyCodesList } from "@/components/codes/MyCodesList";
import { ShareDemo } from "./ShareDemo";
import { SharingReward } from "@/components/codes/SharingReward";
import { CodesCard } from "@/components/home/pro-home/CodesCard";

export const metadata: Metadata = { title: "Codes (demo)", robots: { index: false } };

const DAY = 86_400_000;
const REASONS: RedeemFailReason[] = ["not_found", "expired", "used_up", "already_redeemed", "own_code", "rate_limited", "not_available", "already_unlimited"];

// Dev-only: the /codes components with sample data (no sign-in or migration 32 needed).
// Not served in production.
export default function CodesDemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  // eslint-disable-next-line react-hooks/purity -- dev demo, rendered once
  const now = Date.now();
  const iso = (d: number) => new Date(now + d * DAY).toISOString();
  const codes: MyCode[] = [
    { code: "K7MPX", type: "practice_set", useCount: 12, maxUses: null, expiresAt: null, createdAt: iso(-2), title: "Vectors: mixed Paper 1", note: null, setId: "x", hubItemId: null, itemCount: null },
    { code: "T4QWB", type: "hub_item", useCount: 1, maxUses: null, expiresAt: null, createdAt: iso(-9), title: "Physics IA draft due", note: null, setId: null, hubItemId: "itm-1", itemCount: null },
    { code: "R8VN3HD2KA", type: "pro_trial", useCount: 3, maxUses: 10, expiresAt: iso(60), createdAt: iso(-1), title: null, note: "Beta wave 1", setId: null, hubItemId: null, itemCount: null },
    { code: "P2XQ9ZB7MW", type: "pro_trial", useCount: 1, maxUses: 1, expiresAt: null, createdAt: iso(-5), title: null, note: "Contest prize", setId: null, hubItemId: null, itemCount: null },
    { code: "GH3YDEC4NS", type: "pro_trial", useCount: 0, maxUses: 1, expiresAt: iso(-1), createdAt: iso(-40), title: null, note: null, setId: null, hubItemId: null, itemCount: null },
    { code: "ZK8RT", type: "practice_set", useCount: 0, maxUses: null, expiresAt: null, createdAt: iso(-20), title: null, note: null, setId: null, hubItemId: null, itemCount: null },
    { code: "M4HQB", type: "hub_set", useCount: 4, maxUses: null, expiresAt: null, createdAt: iso(-3), title: "Paper 1 revision plan", note: null, setId: null, hubItemId: null, itemCount: 14 },
  ];
  const wins: RedeemResult[] = [
    { ok: true, type: "practice_set", setId: "x", title: "Vectors: mixed Paper 1", subjectId: "math_aa" },
    { ok: true, type: "hub_item", hubItemId: "itm-1", title: "Physics IA draft due", startAt: iso(10) },
    { ok: true, type: "hub_set", name: "Paper 1 revision plan", count: 14, firstStart: iso(3), shiftDays: 9 },
    { ok: true, type: "pro_trial", days: 30, startsAt: iso(0), expiresAt: iso(30), extended: false },
    { ok: true, type: "pro_trial", days: 30, startsAt: iso(14), expiresAt: iso(44), extended: true },
  ];

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl flex flex-col gap-xl">
      <header className="flex flex-col gap-sm">
        <h1 className="font-serif font-bold text-headline-lg md:text-display-lg text-on-surface">Codes</h1>
        <p className="text-body-lg text-on-surface-variant">Redeem a code someone gave you, or see the ones you&apos;ve shared.</p>
      </header>
      <RedeemBox initialCode="k7m-px" />
      <section className="flex flex-col gap-md" id="home-card">
        <h2 className="font-serif font-bold text-headline-md text-on-surface">Home card</h2>
        <CodesCard stats={null} />
        <CodesCard stats={{ uses: 5, friends: 2, goal: 3, rewardDays: 7, claimedAt: null, canClaim: false }} />
        <CodesCard stats={{ uses: 9, friends: 3, goal: 3, rewardDays: 7, claimedAt: null, canClaim: true }} />
      </section>
      <section className="flex flex-col gap-md" id="reward">
        <SharingReward stats={{ uses: 0, friends: 0, goal: 3, rewardDays: 7, claimedAt: null, canClaim: false }} />
        <SharingReward stats={{ uses: 5, friends: 2, goal: 3, rewardDays: 7, claimedAt: null, canClaim: false }} />
        <SharingReward stats={{ uses: 9, friends: 4, goal: 3, rewardDays: 7, claimedAt: null, canClaim: true }} />
        <SharingReward stats={{ uses: 14, friends: 6, goal: 3, rewardDays: 7, claimedAt: "2026-11-01T10:00:00Z", canClaim: false }} />
      </section>
      <section className="flex flex-col gap-md">
        <h2 className="font-serif font-bold text-headline-md text-on-surface">What you can share</h2>
        <ShareableTypes />
      </section>
      <section className="flex flex-col gap-md">
        <h2 className="font-serif font-bold text-headline-md text-on-surface">My codes</h2>
        <MyCodesList codes={codes} origin="http://localhost:3000" now={now} />
        <MyCodesList codes={[]} origin="http://localhost:3000" now={now} />
      </section>
      <section className="flex flex-col gap-md" id="outcomes">
        <h2 className="font-serif font-bold text-headline-md text-on-surface">Every outcome</h2>
        {[...wins, ...REASONS.map((reason) => ({ ok: false as const, reason }))].map((r, i) => (
          <Outcome key={i} result={r} />
        ))}
      </section>
      <ShareDemo />
    </div>
  );
}
