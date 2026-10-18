"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getViewerPrefsAction, type ViewerPrefs } from "@/app/actions/viewer";

// Plan and saved theme, shared by every caller and asked again whenever the
// sign-in changes (login and logout redirect without a full page load, so a
// once-per-load answer went stale until a refresh). Only asked when there's a
// Supabase sign-in cookie, so signed-out visitors never trigger a server call.

const SIGNED_OUT: ViewerPrefs = { signedIn: false, isPro: false, theme: null, midnightTip: false, news: null };
let cached: { key: string; prefs: Promise<ViewerPrefs> } | null = null;

/** The Supabase auth cookies as one string: "" when signed out; changes on sign-in, sign-out or account switch. */
function authKey(): string {
  if (typeof document === "undefined") return "";
  return document.cookie
    .split(";")
    .map((c) => c.trim())
    .filter((c) => {
      const name = c.split("=")[0];
      return name.startsWith("sb-") && name.includes("auth-token");
    })
    .sort()
    .join(";");
}

export function loadViewerPrefs(): Promise<ViewerPrefs> {
  const key = authKey();
  if (!cached || cached.key !== key) {
    cached = { key, prefs: key ? getViewerPrefsAction().catch(() => SIGNED_OUT) : Promise.resolve(SIGNED_OUT) };
  }
  return cached.prefs;
}

/** Re-read after every navigation; only changes when the sign-in does. */
export function useAuthKey(): string {
  const pathname = usePathname();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname is the trigger: cookies can't be subscribed to
  return useMemo(() => authKey(), [pathname]);
}

/** null while loading. */
export function useViewerPrefs(): ViewerPrefs | null {
  const key = useAuthKey();
  const [prefs, setPrefs] = useState<ViewerPrefs | null>(null);
  useEffect(() => {
    let live = true;
    void loadViewerPrefs().then((p) => {
      if (live) setPrefs(p);
    });
    return () => {
      live = false;
    };
  }, [key]);
  return prefs;
}

/** null while loading, then whether the visitor has DiplomaPro. */
export function useIsPro(): boolean | null {
  return useViewerPrefs()?.isPro ?? null;
}
