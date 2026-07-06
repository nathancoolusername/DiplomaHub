"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-outline-variant">
      <div className="max-w-[2000px] mx-lg px-lg h-16 flex items-center justify-between">
        <div className="flex items-center gap-xl">
          <Link href="/">
            <span className="font-serif text-headline-md font-bold flex flex-row">
              Diploma<h1 className="text-primary">Hub</h1>
            </span>
          </Link>
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

        <div className="flex items-center gap-md">{authSlot}</div>
      </div>
    </header>
  );
}
