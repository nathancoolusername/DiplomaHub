// components/AuthNav.tsx
import { createClient } from "@/app/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import Button from "./button";
import Link from "next/link";

export async function AuthNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      <span className="text-body-lg text-primary font-bold font-serif">
        {profile?.display_name} · {profile?.points}pts {profile?.is_pro && "⭐"}
      </span>
    </div>
  );
}
