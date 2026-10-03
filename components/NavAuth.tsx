"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { signOut } from "@/app/auth/actions";
import { isAdmin } from "@/app/lib/admin";
import Button from "./button";
import ProfileDropdown from "./profileMenu";
import { NotificationBell } from "./notifications/NotificationBell";

type NavUser = { id: string; display_name: string; points: number; is_pro: boolean };

// Rendered in the browser on purpose. As a server component in the root
// layout, this read the session (via headers()) and queried the users row
// twice on every request, which forced every page on the site to render
// dynamically — even ones with nothing personal on them (About, legal,
// roadmap). Reading the session cookie locally and querying Supabase
// straight from the browser lets those pages be served statically and
// takes this lookup off Vercel entirely.
export function AuthNav() {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  // undefined = still loading, null = signed out.
  const [user, setUser] = useState<NavUser | null | undefined>(undefined);

  // Re-checked on navigation so sign-in/sign-out redirects (and points
  // earned since the last page) show up without a full reload.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // getSession() reads the cookie locally, no network call — fine for
      // deciding what to display. Everything that actually needs auth still
      // verifies it server-side (proxy.ts, server actions, RLS).
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId) {
        if (!cancelled) setUser(null);
        return;
      }
      const { data: profile } = await supabase
        .from("users")
        .select("display_name, points, is_pro")
        .eq("id", userId)
        .single();
      if (!cancelled) setUser(profile ? { id: userId, ...profile } : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, pathname]);

  if (user === undefined) {
    return <div className="w-20 h-5 bg-gray-100 rounded animate-pulse" />;
  }

  if (!user) {
    return (
      <Link href="/login">
        <Button>Login</Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-3">
      <NotificationBell />
      <ProfileDropdown
        display_name={user.display_name}
        is_pro={user.is_pro}
        points={user.points}
        sign_out={signOut}
        id={user.id}
        isAdmin={isAdmin(user.id)}
      />
    </div>
  );
}
