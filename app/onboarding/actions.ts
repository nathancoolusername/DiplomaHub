"use server";

import { revalidatePath } from "next/cache";
import { completeOnboarding, dismissHint, getViewer, type OnboardingAnswers } from "@/lib/data";

/** Saves onboarding. No starter set: students choose what to practise first. */
export async function completeOnboardingAction(answers: OnboardingAnswers): Promise<void> {
  await getViewer();
  await completeOnboarding(answers);
  revalidatePath("/", "layout");
}

/** Remembers that a first-time hint was dismissed, so it never returns. */
export async function dismissHintAction(id: string): Promise<void> {
  await getViewer();
  await dismissHint(id);
}
