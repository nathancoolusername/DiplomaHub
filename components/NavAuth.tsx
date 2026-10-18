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

// The name and points barely change between pages, and the points come from
// my_leaderboard_standing, which adds up everyone's points to rank you. So
// they're kept for a minute, and fetched again straight away only where they
// can change: results (points just earned), the leaderboard and the profile.
const NAV_TTL_MS = 60_000;
const FRESH_PATHS = ["/practice/attempts/", "/leaderboard", "/profile"];
let navCache: { user: NavUser; at: number } | null = null;

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
        navCache = null;
        if (!cancelled) setUser(null);
        return;
      }
      const fresh = navCache && navCache.user.id === userId && Date.now() - navCache.at < NAV_TTL_MS;
      if (fresh && !FRESH_PATHS.some((p) => pathname.startsWith(p))) {
        if (!cancelled) setUser(navCache!.user);
        return;
      }
      // Next to the profile: all-time practice points (the leaderboard's points).
      const [{ data: profile }, standing] = await Promise.all([
        supabase.from("users").select("display_name, is_pro").eq("id", userId).single(),
        supabase.rpc("my_leaderboard_standing", { p_period: "all" }),
      ]);
      const points = (standing.data as { points?: number } | null)?.points ?? 0;
      const next = profile ? { id: userId, ...profile, points } : null;
      navCache = next ? { user: next, at: Date.now() } : null;
      if (!cancelled) setUser(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, pathname]);

  if (user === undefined) {
    return <div className="w-20 h-5 bg-surface-container rounded animate-pulse" />;
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
