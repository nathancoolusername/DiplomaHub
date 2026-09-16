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

  function handleToggleStatus(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: (item.status === "done" ? "todo" : "done") as HubItemStatus }
          : item,
      ),
    );
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newStatus: HubItemStatus = item.status === "done" ? "todo" : "done";
    updateHubItemStatus(id, newStatus).catch(console.error);
  }

  function goToHub() {
    router.push("/hub");
  }

  return (
    <div className="flex flex-col gap-lg">
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
