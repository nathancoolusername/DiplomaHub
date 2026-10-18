import { getCurrentUserProfile } from "@/app/lib/get-current-user";
import { getHubItems } from "@/app/lib/actions/hub";
import { getMyHubSubjects } from "@/app/lib/hub-subjects";
import DashboardGreeting from "./dashboard-greeting";
import DashboardSetupPrompt from "./dashboard-setup-prompt";
import DashboardResources from "./dashboard-resources";
import { DiplomaProHome, loadDiplomaProHome } from "./pro-home/DiplomaProHome";

export default async function SignedInHome() {
  // Nearly everyone has set up the Hub, so Home's own data starts now, alongside this.
  const homeData = loadDiplomaProHome();
  // Marked handled now; DiplomaProHome still gets (and throws) any error when it awaits it.
  homeData.catch(() => {});
  const [profile, itemsResult, hubSubjects] = await Promise.all([getCurrentUserProfile(), getHubItems(), getMyHubSubjects()]);

  const firstName = profile?.display_name?.split(" ")[0] ?? null;
  const hasOnboarded = profile?.hub_onboarded_at != null;
  const items = itemsResult.success ? itemsResult.data : [];

  // Onboarding comes first: until it's done, keep the setup prompt.
  if (!hasOnboarded) {
    return (
      <div className="flex flex-col">
        <div className="bg-primary px-md py-14 md:py-20">
          <div className="max-w-[1600px] mx-auto w-full">
            <DashboardGreeting firstName={firstName} />
          </div>
        </div>
        <div className="bg-surface-container-low px-md py-xl">
          <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-lg">
            <DashboardSetupPrompt />
            <DashboardResources hubSubjects={null} washed />
          </div>
        </div>
      </div>
    );
  }

  return <DiplomaProHome nextDaysItems={items} hubSubjects={hubSubjects.subjectIds} data={homeData} />;
}
