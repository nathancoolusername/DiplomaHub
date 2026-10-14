import { getCurrentUserProfile } from "@/app/lib/get-current-user";
import { getHubItems } from "@/app/lib/actions/hub";
import DashboardGreeting from "./dashboard-greeting";
import DashboardSetupPrompt from "./dashboard-setup-prompt";
import DashboardResources from "./dashboard-resources";
import { DiplomaProHome } from "./pro-home/DiplomaProHome";

export default async function SignedInHome() {
  const [profile, itemsResult] = await Promise.all([getCurrentUserProfile(), getHubItems()]);

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

  return <DiplomaProHome nextDaysItems={items} hubSubjects={profile?.hub_subjects ?? null} />;
}
