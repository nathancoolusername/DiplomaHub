"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Timer, X } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { MidnightTip } from "./MidnightTip";
import { StyleTip } from "./StyleTip";
import { FortyFiveMark } from "./forty-five/FortyFiveMark";
import { NewsToast } from "./NewsToast";

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
  { label: "Bro", href: "/bro" },
  { label: "Progress", href: "/progress" },
  { label: "Resources", href: "/resources" },
  { label: "Articles", href: "/articles" },
  // Roadmap and About live in the footer.
];

export default function Navbar({ authSlot }: { authSlot: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Outside the header: its backdrop blur would pin a fixed child to the header. */}
      <NewsToast />
      <header className="sticky top-0 z-50 bg-surface glass border-b border-outline-variant">
        <div className="max-w-[2000px] mx-lg lg:mx-0 xl:mx-lg px-lg h-16 flex items-center justify-between">
          <div className="flex items-center gap-lg xl:gap-xl">
            <Logo />
            <nav className="hidden lg:flex gap-md xl:gap-lg">
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
              <FortyFiveLink active={pathname === "/forty-five"} />
              <DeadlineLink active={pathname.startsWith("/play/deadline")} />
            </nav>
          </div>

          <div className="relative flex items-center gap-sm sm:gap-md">
            {/* Phones: under the menu button (on computers it's in the theme picker, on the palette). */}
            <div className="lg:hidden">
              <StyleTip />
            </div>
            <MidnightTip />
            {/* On phones the theme picker lives in the menu, away from the logo. */}
            <div className="hidden lg:block">
              <ThemeSwitcher tip />
            </div>
            {authSlot}
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="lg:hidden p-sm -mr-sm text-on-surface-variant hover:text-primary cursor-pointer"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="lg:hidden flex flex-col border-t border-outline-variant bg-surface">
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
            <Link
              href="/forty-five"
              onClick={() => setMenuOpen(false)}
              className={`px-lg py-md text-body-md font-semibold transition-colors flex items-center gap-sm ${
                pathname === "/forty-five" ? "text-primary bg-surface-container-low" : "text-on-surface hover:text-primary hover:bg-surface-container-low"
              }`}
            >
              <FortyFiveMark /> Forty-Five <span className="text-label-sm font-normal text-on-surface-variant">daily puzzle</span>
            </Link>
            <Link
              href="/play/deadline"
              onClick={() => setMenuOpen(false)}
              className={`px-lg py-md text-body-md font-semibold transition-colors flex items-center gap-sm ${
                pathname.startsWith("/play/deadline") ? "text-primary bg-surface-container-low" : "text-on-surface hover:text-primary hover:bg-surface-container-low"
              }`}
            >
              <Timer size={14} className="text-error" aria-hidden="true" /> Deadline <span className="text-label-sm font-normal text-on-surface-variant">party game with friends</span>
            </Link>
            {/* Phones only: the desktop bar has no room, and signed-in people also have it in the profile menu. */}
            <Link
              href="/codes"
              onClick={() => setMenuOpen(false)}
              className={`px-lg py-md text-body-md transition-colors ${
                pathname === "/codes" ? "text-primary font-bold bg-surface-container-low" : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
              }`}
            >
              Codes
            </Link>
            <div className="px-lg py-md flex items-center justify-between gap-md border-t border-outline-variant">
              <span className="text-body-md text-on-surface-variant">Theme</span>
              <ThemeSwitcher />
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

/** Highlighted link to the daily puzzle (desktop bar). */
function FortyFiveLink({ active }: { active: boolean }) {
  return (
    <Link
      href="/forty-five"
      aria-label="Forty-Five"
      title="Forty-Five: daily puzzle"
      className={`-my-1 hidden lg:inline-flex items-center gap-xs whitespace-nowrap rounded-full border px-sm py-1 text-body-md font-semibold transition-colors ${
        active ? "border-primary bg-primary-fixed text-primary" : "border-outline-variant text-on-surface hover:border-primary hover:text-primary"
      }`}
    >
      <FortyFiveMark />
      {/* Mark only on small laptops / iPad landscape, where the full label overflows the bar. */}
      <span className="hidden xl:inline">Forty-Five</span>
    </Link>
  );
}

/** Highlighted link to the party game (desktop bar), next to Forty-Five. */
function DeadlineLink({ active }: { active: boolean }) {
  return (
    <Link
      href="/play/deadline"
      aria-label="Deadline"
      title="Deadline: party game with friends"
      className={`-my-1 hidden lg:inline-flex items-center gap-xs whitespace-nowrap rounded-full border px-sm py-1 text-body-md font-semibold transition-colors ${
        active ? "border-primary bg-primary-fixed text-primary" : "border-outline-variant text-on-surface hover:border-primary hover:text-primary"
      }`}
    >
      <Timer size={14} className="text-error" aria-hidden="true" />
      {/* Icon only on small laptops / iPad landscape, like Forty-Five. */}
      <span className="hidden xl:inline">Deadline</span>
    </Link>
  );
}
