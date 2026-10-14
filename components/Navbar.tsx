"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeSwitcher } from "./ThemeSwitcher";

// /hub is the only route with a loading.tsx, which makes it the one dynamic
// route Next prefetches automatically — and without a client cache for it,
// so a navbar link visible on every page meant an extra server render of
// the layout + loading shell on nearly every page view. Navigating there
// still shows the loading skeleton; it just isn't fetched ahead of time.
const NO_PREFETCH = new Set(["/hub"]);

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Hub", href: "/hub" },
  { label: "Practice", href: "/practice" },
  { label: "Resources", href: "/resources" },
  { label: "Articles", href: "/articles" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "About", href: "/about" },
];

export default function Navbar({ authSlot }: { authSlot: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface glass border-b border-outline-variant">
      <div className="max-w-[2000px] mx-lg px-lg h-16 flex items-center justify-between">
        <div className="flex items-center gap-xl">
          <Logo />
          <nav className="hidden md:flex gap-lg">
            {navLinks.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={NO_PREFETCH.has(link.href) ? false : undefined}
                  className={`text-body-md transition-colors ${
                    isActive
                      ? "text-primary font-bold border-b-2 border-primary pb-1"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-sm sm:gap-md">
          {/* On phones the theme picker lives in the menu, away from the logo. */}
          <div className="hidden md:block">
            <ThemeSwitcher />
          </div>
          {authSlot}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden p-sm -mr-sm text-on-surface-variant hover:text-primary cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden flex flex-col border-t border-outline-variant bg-surface">
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={NO_PREFETCH.has(link.href) ? false : undefined}
                onClick={() => setMenuOpen(false)}
                className={`px-lg py-md text-body-md transition-colors ${
                  isActive
                    ? "text-primary font-bold bg-surface-container-low"
                    : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="px-lg py-md flex items-center justify-between gap-md border-t border-outline-variant">
            <span className="text-body-md text-on-surface-variant">Theme</span>
            <ThemeSwitcher />
          </div>
        </nav>
      )}
    </header>
  );
}
