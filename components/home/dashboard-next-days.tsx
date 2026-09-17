import Link from "next/link";
import { Check } from "lucide-react";
import type { HubItem } from "@/components/hub/mock-data";
import { getSubjectColor } from "@/components/hub/subject-colors";
import { ITEM_TYPE_META } from "@/components/hub/item-type-meta";
import { formatTime, isSameDay, addDays, startOfDay } from "@/components/hub/calendar/calendar-utils";

const DAY_COUNT = 3;

// A condensed 3-day agenda for the dashboard — same data source and color
// language as the Hub's own day-agenda.tsx, just narrowed to today +
// tomorrow + the day after instead of a full week. Renders directly onto
// whichever band its parent puts it on (the signed-in dashboard's
// alternating washed/white sections) rather than boxing its own
// background, so it doesn't double up with the section around it.
export default function DashboardNextDays({ items }: { items: HubItem[] }) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: DAY_COUNT }, (_, i) => addDays(today, i));

  return (
    <div className="flex flex-col gap-md">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-sm font-serif font-bold text-on-surface">Next 3 days</h2>
        <Link href="/hub" className="text-label-md font-semibold text-primary hover:underline">
          Open the Hub
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
        {days.map((day, i) => {
          const dayItems = items
            .filter((item) => isSameDay(item.start, day))
            .sort((a, b) => a.start.getTime() - b.start.getTime());
          const label =
            i === 0 ? "Today" : i === 1 ? "Tomorrow" : day.toLocaleDateString(undefined, { weekday: "long" });

          return (
            <div key={i} className="bg-surface-container-lowest rounded-lg p-md flex flex-col gap-sm min-h-32">
              <span className="text-label-md font-semibold text-on-surface">{label}</span>
              {dayItems.length === 0 ? (
                <p className="text-label-md text-on-surface-variant">Nothing scheduled</p>
              ) : (
                <div className="flex flex-col gap-xs">
                  {dayItems.map((item) => {
                    const color = getSubjectColor(item.subjectId);
                    const { Icon } = ITEM_TYPE_META[item.type];
                    const done = item.status === "done";
                    return (
                      <Link
                        key={item.id}
                        href="/hub"
                        className={`flex items-center gap-xs border-l-[3px] pl-sm py-[2px] hover:bg-surface-container-low transition-colors ${done ? "opacity-60" : ""}`}
                        style={{ borderLeftColor: color.base }}
                      >
                        {done ? (
                          <Check size={12} className="shrink-0 text-on-surface-variant" />
                        ) : (
                          <Icon size={12} className="shrink-0" style={{ color: color.base }} aria-hidden="true" />
                        )}
                        <span
                          className={`text-label-sm font-medium truncate ${done ? "line-through text-on-surface-variant" : "text-on-surface"}`}
                        >
                          {item.allDay ? item.title : `${formatTime(item.start)} ${item.title}`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
