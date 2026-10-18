import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { bookletFor } from "@/lib/booklets";
import { getTopicTree } from "@/lib/data";
import { BookletDemo } from "./BookletDemo";

export const metadata: Metadata = { title: "Formula booklet", robots: { index: false } };

// Dev-only demo of the player's booklets: /dev/booklet?subject=chemistry&level=SL&topic=S3.
// Not served in production.
export default async function BookletDemoPage({ searchParams }: { searchParams: Promise<{ subject?: string; level?: string; topic?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { subject = "math_aa", level: rawLevel, topic = "" } = await searchParams;
  const level = rawLevel === "SL" ? "SL" : "HL";
  const booklet = bookletFor(subject, level);
  if (!booklet) notFound();
  const topicNames = Object.fromEntries(getTopicTree(subject).map((t) => [t.code, t.name]));
  return <BookletDemo booklet={booklet} level={level} topic={topic} topicNames={topicNames} />;
}
