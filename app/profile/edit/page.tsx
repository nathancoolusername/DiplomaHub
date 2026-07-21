// app/profile/page.tsx
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ResendConfirmationButton } from "@/components/profile/ReconfirmButton";
import {
  getCurrentUserProfile,
  getCurrentUser,
} from "@/app/lib/get-current-user";

export default async function ProfilePage() {
  const profile = await getCurrentUserProfile();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!profile) redirect("/login");

  const emailConfirmed = !!user.email_confirmed_at;

  return (
    <div className="space-y-6 bg-surface-container max-w-[600px] mx-auto px-md h-full py-20">
      <h1 className="text-display-lg font-serif font-semibold">Your profile</h1>

      {!emailConfirmed && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div>
            <p className="text-sm font-medium text-amber-800">
              Confirm your email
            </p>
            <p className="text-sm text-amber-700">
              We sent a link to {profile.email}. Check your inbox to confirm.
            </p>
          </div>
          <ResendConfirmationButton email={profile.email} />
        </div>
      )}

      <ProfileForm profile={profile} email={profile.email} />
    </div>
  );
}
