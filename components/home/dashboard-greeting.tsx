import Link from "next/link";
import { LayoutDashboard, BookOpen } from "lucide-react";
import { getGreeting } from "@/components/hub/format";

export default function DashboardGreeting({ firstName }: { firstName: string | null }) {
  const now = new Date();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
      <h1 className="text-display-lg font-serif font-bold text-on-primary">
        {getGreeting(now)}
        {firstName ? `, ${firstName}` : ""}
      </h1>
      <div className="flex flex-col sm:flex-row gap-sm shrink-0">
        <Link href="/resources">
          <button className="w-full sm:w-auto flex items-center justify-center gap-sm bg-surface-container-lowest text-primary border-2 border-primary rounded-lg px-lg py-sm text-body-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer">
            <BookOpen size={18} />
            Open resources
          </button>
        </Link>
        <Link href="/hub">
          {/* border-2 border-transparent (not just omitting the border) so
              this button's box is exactly as tall as the bordered one next
              to it — a border still occupies layout space even when
              invisible, so a real vs. absent border would otherwise leave
              them a few px off from each other. */}
          <button className="w-full sm:w-auto flex items-center justify-center gap-sm bg-surface-container-lowest text-primary border-2 border-transparent rounded-lg px-lg py-sm text-body-lg font-semibold hover:opacity-90 transition-opacity cursor-pointer">
            <LayoutDashboard size={18} />
            Open the Hub
          </button>
        </Link>
      </div>
    </div>
  );
}
