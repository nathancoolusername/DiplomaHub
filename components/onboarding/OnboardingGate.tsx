import { getAllSubjects, getExamSessions, getOnboardingSubjects, getSubjectsWithQuestions, getViewer, needsOnboarding } from "@/lib/data";
import { getCurrentUserProfile } from "@/app/lib/get-current-user";
import { defaultHubSession } from "@/components/hub/format";
import { sessionIdFromLabel } from "@/lib/exam-sessions";
import { OnboardingWizard } from "./OnboardingWizard";

/** Renders the onboarding wizard over the page for anyone who hasn't done it yet. */
export async function OnboardingGate() {
  if (!(await needsOnboarding())) return null;
  const [viewer, sessions, initialSubjects, catalog, practiceIds, profile] = await Promise.all([
    getViewer(),
    getExamSessions(),
    getOnboardingSubjects(),
    getAllSubjects(),
    getSubjectsWithQuestions().catch(() => null),
    getCurrentUserProfile(),
  ]);
  // No session saved yet: start from what the Hub shows this student (their year's default).
  const hubGuess = sessionIdFromLabel(defaultHubSession(false, profile?.ib_year ?? null));
  return (
    <OnboardingWizard
      firstName={viewer.firstName}
      sessions={sessions}
      currentSessionId={viewer.examSessionId ?? (hubGuess && sessions.some((s) => s.id === hubGuess) ? hubGuess : null)}
      userId={viewer.examSessionId ? null : viewer.id}
      initialSubjects={initialSubjects}
      catalog={catalog}
      practiceIds={practiceIds}
    />
  );
}
