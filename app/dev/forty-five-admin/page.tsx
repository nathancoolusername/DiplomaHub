import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { SourcePuzzle } from "@/lib/forty-five/format";
import { checkBank } from "@/lib/forty-five/checks";
import type { AdminFortyFivePuzzle } from "@/app/lib/actions/admin-forty-five";
import { FortyFiveReview, ScheduleButton } from "@/components/admin/FortyFiveReview";

export const metadata: Metadata = { title: "Forty-Five admin (demo)", robots: { index: false } };

// Dev-only: the /admin/forty-five review UI fed from content/forty-five/daily
// (no sign-in or migration 34 needed; buttons are disabled). Not served in production.
export default function FortyFiveAdminDemo() {
  if (process.env.NODE_ENV === "production") notFound();
  const dir = path.join(process.cwd(), "content/forty-five/daily");
  const sources: SourcePuzzle[] = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
    : [];
  const checks = checkBank(sources);
  const puzzles: AdminFortyFivePuzzle[] = sources.map((s, i) => ({
    id: s.slug,
    slug: s.slug,
    mode: s.mode,
    subject: s.subject,
    status: i < 3 ? "approved" : i === 3 ? "rejected" : "draft",
    scheduledFor: i < 2 ? `2026-11-1${i}` : null,
    number: i < 2 ? i + 1 : null,
    reviewNote: i === 3 ? "Demo: rejected" : null,
    traps: s.traps,
    groups: s.groups,
    check: checks.get(s.slug) ?? { errors: [], warnings: [] },
    live: false,
  }));
  return (
    <div className="max-w-[1400px] mx-auto px-md py-lg flex flex-col gap-lg">
      <div className="flex justify-between items-end gap-md">
        <h1 className="font-serif font-bold text-headline-lg text-on-surface">Forty-Five review (demo, {puzzles.length} puzzles)</h1>
        <ScheduleButton ready={1} demo />
      </div>
      <FortyFiveReview puzzles={puzzles} demo />
    </div>
  );
}
