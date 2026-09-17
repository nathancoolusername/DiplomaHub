import Hero from "./hero";
import HowItWorks from "./how-it-works";
import ResourcesBySubject from "./resources-by-subject";
import ResourceHome from "./article-section/article-home";
import FinalCta from "./final-cta";
import { getFeaturedResources } from "@/app/lib/actions/resources";

export default async function SignedOutHome() {
  const resourcesResult = await getFeaturedResources(6);
  const resources = resourcesResult.success ? resourcesResult.data : [];

  return (
    <div className="flex flex-col">
      <Hero />
      <ResourcesBySubject />
      <HowItWorks />
      <ResourceHome data={resources} />
      <FinalCta />
    </div>
  );
}
