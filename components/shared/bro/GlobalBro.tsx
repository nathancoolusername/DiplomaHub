"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import { BroButton } from "./BroButton";
import { useBroPlacement } from "./bro-visibility";
import { setBroChatOwner } from "./useBroChat";

// The Bro button on every page for Pro students (root layout). Pages that
// render their own BroButton (Practice, Hub, Pro home: they also show it,
// locked, to free students and carry the first-time hint) take over, and
// this one steps aside. Worked out in the browser, like the nav's AuthNav,
// so static pages stay static.

// No Bro button here: the full-page chat, sign-in pages and Admin.
const SKIP = [/^\/bro(\/|$)/, /^\/(login|signup|forgot-password|reset-password|auth)(\/|$)/, /^\/admin(\/|$)/, /^\/onboarding(\/|$)/];

let cached: { userId: string; isPro: boolean; at: number } | null = null;
const TTL_MS = 60_000;

export function GlobalBro() {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const { pageButtons } = useBroPlacement();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user.id;
      setBroChatOwner(userId ?? null);
      if (!userId) {
        cached = null;
        if (!cancelled) setIsPro(false);
        return;
      }
      if (cached && cached.userId === userId && Date.now() - cached.at < TTL_MS) {
        if (!cancelled) setIsPro(cached.isPro);
        return;
      }
      const { data } = await supabase.from("users").select("is_pro, pro_expires_at").eq("id", userId).single();
      const until = data?.pro_expires_at === "infinity" ? Infinity : data?.pro_expires_at ? Date.parse(data.pro_expires_at) : 0;
      const pro = !!data?.is_pro && until > Date.now();
      cached = { userId, isPro: pro, at: Date.now() };
      if (!cancelled) setIsPro(pro);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, pathname]);

  if (!isPro || pageButtons > 0 || SKIP.some((re) => re.test(pathname))) return null;
  return <BroButton isPro global />;
}
