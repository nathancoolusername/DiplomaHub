import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DeadlinePreview } from "./Preview";

export const metadata: Metadata = { title: "Deadline (dev)", robots: { index: false } };

// Dev-only: the Deadline room (lobby, game, end, chat, reactions) on a fake
// engine with bots, no sign-in or migration 56. Not served in production.
export default function DeadlineDevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="bg-surface-container-low min-h-full">
      <div className="max-w-[1400px] mx-auto px-md md:px-lg py-lg">
        <DeadlinePreview />
      </div>
    </div>
  );
}
