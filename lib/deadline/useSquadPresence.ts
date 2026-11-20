"use client";

import { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/app/lib/supabase/client";

/**
 * Who's on this squad's page right now (Supabase Presence on the private
 * channel squad:{id}; the realtime policies from migration 56 let only
 * members in). Connected only while the tab is visible, to keep within the
 * realtime connection limit.
 */
export function useSquadPresence(squadId: string, me: string | null): Set<string> {
  const supabase = useMemo(() => createClient(), []);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (!me || !visible) return;
    let channel: RealtimeChannel | null = null;
    let cancelled = false;
    (async () => {
      await supabase.realtime.setAuth();
      if (cancelled) return;
      channel = supabase.channel(`squad:${squadId}`, { config: { private: true, presence: { key: me } } });
      channel
        .on("presence", { event: "sync" }, () => setOnline(new Set(Object.keys(channel!.presenceState()))))
        .subscribe((status) => {
          if (status === "SUBSCRIBED") void channel!.track({ at: Date.now() });
        });
    })();
    return () => {
      cancelled = true;
      setOnline(new Set());
      if (channel) void supabase.removeChannel(channel);
    };
  }, [supabase, squadId, me, visible]);

  return online;
}
