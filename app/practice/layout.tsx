import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/app/lib/get-current-user";
import { getPendingHints, getViewer } from "@/lib/data";
import { BroButton } from "@/components/shared/bro/BroButton";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";

export const metadata: Metadata = {
  title: "Practice",
  robots: { index: false },
};

// Practice needs an account: attempts and strength are saved per student.
export default async function PracticeLayout({ children }: { children: React.ReactNode }) {
  if (!(await getCurrentUserId())) redirect("/login?next=/practice");
  const [viewer, hints] = await Promise.all([getViewer(), getPendingHints()]);
  return (
    <div className="bg-surface-container-low min-h-[calc(100vh-4rem)]">
      {children}
      <BroButton isPro={viewer.isPro} hintPending={hints.includes("bro-button")} />
      <OnboardingGate />
    </div>
  );
}
