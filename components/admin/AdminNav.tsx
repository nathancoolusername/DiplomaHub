"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Compass, Hourglass, LayoutDashboard, MessageSquare, Route, ShieldCheck, Users } from "lucide-react";

const TABS = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/hub", label: "Hub", Icon: Compass },
  { href: "/admin/practice", label: "Practice", Icon: BarChart3 },
  { href: "/admin/waitlist", label: "Waitlist", Icon: Hourglass },
  { href: "/admin/content", label: "Moderation", Icon: ShieldCheck },
  { href: "/admin/feedback", label: "Feedback", Icon: MessageSquare },
  { href: "/admin/roadmap", label: "Roadmap", Icon: Route },
] as const;

/** The admin tab bar: scrolls sideways on phones, highlights the current page. */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-md px-md md:mx-0 md:px-0 overflow-x-auto">
      <ul className="flex gap-xs min-w-max border-b border-outline-variant">
        {TABS.map(({ href, label, Icon, ...rest }) => {
          const active = "exact" in rest ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px inline-flex items-center gap-xs px-md py-sm text-body-md font-semibold border-b-2 transition-colors ${
                  active ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
