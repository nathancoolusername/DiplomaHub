import ResourcesBySubject from "./resources-by-subject";
import ResourceHome from "./article-section/article-home";
import { getFeaturedResources } from "@/app/lib/actions/resources";
import { getSampleQuestions } from "@/lib/marketing/sample";
import ProHero from "./signed-out/ProHero";
import { TryQuestion } from "./signed-out/TryQuestion";
import HowItWorksPro from "./signed-out/HowItWorksPro";
import MeetBro from "./signed-out/MeetBro";
import LeaderboardTeaser from "./signed-out/LeaderboardTeaser";
import FreeVsPro from "./signed-out/FreeVsPro";
import ProFinalCta from "./signed-out/ProFinalCta";

// Practice-first homepage for signed-out visitors. Everything here is the
// same for every visitor (ISR — see app/page.tsx), so sample content comes
// from lib/marketing/sample.ts, never from per-user data.
export default async function SignedOutHome() {
  const resourcesResult = await getFeaturedResources(6);
  const resources = resourcesResult.success ? resourcesResult.data : [];

  return (
    <div className="flex flex-col">
      <ProHero />
      <TryQuestion samples={getSampleQuestions()} />
      <HowItWorksPro />
      <LeaderboardTeaser />
      <MeetBro />
      <FreeVsPro />
      <ResourcesBySubject />
      <ResourceHome data={resources} />
      <ProFinalCta />
    </div>
  );
}
