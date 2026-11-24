import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProHub } from "@/components/pro/ProHub";

export const metadata: Metadata = { title: "Pro hub (demo)", robots: { index: false } };

// Dev-only: the Pro hub (/pro for Pro students) with sample data. Not served in production.
export default function ProHubDemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const iso = (days: number) => new Date(Date.UTC(2026, 10, 24) + days * 86_400_000).toISOString();
  return (
    <ProHub
      status={{ isPro: true, plan: "monthly", expiresAt: iso(30), badgeHidden: false }}
      usage={{ bro_message: 23, opus_escalation: 2, generated_question: 0 }}
      allowance={{ used: 2, cap: 6, remaining: 4, resetsAt: iso(7) }}
      projects={[
        { id: "a", kind: "ia", subjectId: "math_aa", level: "HL", title: "Maths AA IA", question: "", createdAt: iso(-9), updatedAt: iso(-1), drafts: [] },
        { id: "b", kind: "ee", subjectId: "history", level: null, title: "History EE", question: "", createdAt: iso(-20), updatedAt: iso(-3), drafts: [] },
      ]}
      chats={[
        { id: "1", title: "Rates practice before Thursday", updatedAt: iso(-1) },
        { id: "2", title: "IA: choosing a model", updatedAt: iso(-4) },
      ]}
    />
  );
}
