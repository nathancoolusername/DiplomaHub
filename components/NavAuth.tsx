// components/AuthNav.tsx
import { createClient } from "@/app/lib/supabase/server";
import { getCurrentUserProfile } from "@/app/lib/get-current-user";
import { signOut } from "@/app/auth/actions";
import Button from "./button";
import Link from "next/link";
import ProfileDropdown from "./profileMenu";

export async function AuthNav() {
  const supabase = await createClient();
  const user = await getCurrentUserProfile();
  if (!user) {
    return (
      <Link href="/login">
        <Button>Login</Button>
      </Link>
    );
  }

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, points, is_pro")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex items-center gap-3">
      <ProfileDropdown
        display_name={profile?.display_name}
        is_pro={profile?.is_pro}
        points={profile?.points}
        sign_out={signOut}
        id={user.id}
      />
    </div>
  );
}
