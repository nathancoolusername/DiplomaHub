// app/profile/page.tsx
import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ResendConfirmationButton } from "@/components/profile/ReconfirmButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const emailConfirmed = !!user.email_confirmed_at;

  return (
    <div className="max-w-lg mx-auto mt-12 space-y-6">
      <h1 className="text-2xl font-semibold">Your profile</h1>

      {!emailConfirmed && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div>
            <p className="text-sm font-medium text-amber-800">
              Confirm your email
            </p>
            <p className="text-sm text-amber-700">
              We sent a link to {user.email}. Check your inbox to confirm.
            </p>
          </div>
          <ResendConfirmationButton email={user.email!} />
        </div>
      )}

      <ProfileForm profile={profile} email={user.email!} />
    </div>
  );
}
