"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/shared/Switch";
import { setLeaderboardHiddenAction } from "@/app/leaderboard/actions";

/** "Hide me from the leaderboard": you still see your own points and rank. */
export function HideToggle({ hidden }: { hidden: boolean }) {
  const [on, setOn] = useState(hidden);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-xs">
      <Switch
        checked={on}
        onChange={(next) => {
          setOn(next);
          setError(null);
          start(async () => {
            try {
              await setLeaderboardHiddenAction(next);
            } catch {
              setOn(!next);
              setError("Couldn't save that. Try again.");
            }
          });
        }}
        label={pending ? "Saving…" : "Hide me from the leaderboard"}
      />
      {error && <p className="text-label-sm text-error">{error}</p>}
    </div>
  );
}
