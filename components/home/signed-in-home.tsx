import { getCurrentUserProfile } from "@/app/lib/get-current-user";
import { getHubItems } from "@/app/lib/actions/hub";
import DashboardGreeting from "./dashboard-greeting";
import DashboardSetupPrompt from "./dashboard-setup-prompt";
import DashboardHubSummary from "./dashboard-hub-summary";
import DashboardResources from "./dashboard-resources";
import DashboardNextDays from "./dashboard-next-days";

export default async function SignedInHome() {
  const [profile, itemsResult] = await Promise.all([getCurrentUserProfile(), getHubItems()]);

  const firstName = profile?.display_name?.split(" ")[0] ?? null;
  const hasOnboarded = profile?.hub_onboarded_at != null;
  const items = itemsResult.success ? itemsResult.data : [];

  return (
    <div className="flex flex-col">
      <div className="bg-primary px-md py-14 md:py-20">
        <div className="max-w-[1600px] mx-auto w-full">
          <DashboardGreeting firstName={firstName} />
        </div>
      </div>

      {hasOnboarded ? (
        <>
          <div className="bg-surface-container-low px-md py-xl">
            <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-xl">
              <DashboardNextDays items={items} />
              <DashboardHubSummary initialItems={items} />
            </div>
          </div>

          <div className="bg-surface-container-lowest px-md py-xl">
            <div className="max-w-[1600px] mx-auto w-full">
              <DashboardResources hubSubjects={profile?.hub_subjects ?? null} />
            </div>
          </div>
        </>
      ) : (
        <div className="bg-surface-container-low px-md py-xl">
          <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-lg">
            <DashboardSetupPrompt />
            <DashboardResources hubSubjects={null} washed />
          </div>
        </div>
      )}
    </div>
  );
}
