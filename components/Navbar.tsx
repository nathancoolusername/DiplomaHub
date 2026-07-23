"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Community", href: "/community" },
  { label: "Resources", href: "/resources" },
  { label: "Articles", href: "/articles" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "About", href: "/about" },
];

export default function Navbar({ authSlot }: { authSlot: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-outline-variant">
      <div className="max-w-[2000px] mx-lg px-lg h-16 flex items-center justify-between">
        <div className="flex items-center gap-xl">
          <Logo />
          <nav className="hidden md:flex gap-lg">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
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

        <div className="flex items-center gap-md">
          {authSlot}
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden p-sm -mr-sm text-on-surface-variant hover:text-primary cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="md:hidden flex flex-col border-t border-outline-variant bg-surface">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
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
        </nav>
      )}
    </header>
  );
}
