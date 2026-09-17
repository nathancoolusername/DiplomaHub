"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TodayFocus from "@/components/hub/today-focus";
import UpcomingDeadlinesCard from "@/components/hub/upcoming-deadlines-card";
import { updateHubItemStatus } from "@/app/lib/actions/hub";
import type { HubItem, HubItemStatus } from "@/components/hub/mock-data";

// A read-only-ish preview of the Hub on the homepage dashboard: same
// components as /hub itself (both are already self-contained — just
// `items` + callbacks, no dependency on Hub's own reducer/timer), but
// every "open this task" action just sends you to /hub rather than trying
// to reproduce the full calendar/details-panel/focus-mode experience here.
// The done checkbox is the one thing that stays fully real — optimistic
// local update, same pattern Hub itself uses for it.
export default function DashboardHubSummary({ initialItems }: { initialItems: HubItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);

  function handleToggleStatus(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newStatus: HubItemStatus = item.status === "done" ? "todo" : "done";
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));
    updateHubItemStatus(id, newStatus)
      .then((result) => {
        // Revert the optimistic toggle if the save didn't actually happen —
        // otherwise this checkbox would keep showing a state the server
        // never persisted, with no indication anything went wrong.
        if (!result.success) {
          setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: item.status } : i)));
          setError("Couldn't save that — try again from the Hub.");
        }
      })
      .catch(() => {
        setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status: item.status } : i)));
        setError("Couldn't save that — try again from the Hub.");
      });
  }

  function goToHub() {
    router.push("/hub");
  }

  return (
    <div className="flex flex-col gap-lg">
      {error && (
        <p className="text-label-md text-error bg-error-container/30 rounded-lg px-sm py-1.5">{error}</p>
      )}
      <TodayFocus
        items={items}
        onSelect={goToHub}
        onToggleStatus={handleToggleStatus}
        onStartFocus={goToHub}
        onAddItem={goToHub}
      />
      <UpcomingDeadlinesCard items={items} onSelect={goToHub} limit={3} />
    </div>
  );
}
