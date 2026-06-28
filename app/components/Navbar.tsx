"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useRef } from "react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Articles", href: "/articles" },
  { label: "Direction", href: "/direction" },
  { label: "About", href: "/about" },
];

export default function Navbar() {
  const pathname = usePathname();
  const ref = useRef<HTMLInputElement>(null)

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-outline-variant">
      <div className="max-w-[1280px] mx-auto px-margin h-16 flex items-center justify-between">
        <div className="flex items-center gap-xl">
          <Link href="/">
            <span className="font-serif text-headline-md text-primary">IBPeople</span>
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

        <div className="flex items-center gap-md">
          <button className="text-outline hover:text-primary transition-colors" onClick={() => ref.current?.focus()}><Search/></button>
          <input ref={ref} type="text" placeholder="Search..." className="bg-surface-container-low p-xs rounded-lg border-outline-variant border-1">
          </input>
          <Link href="/login">
            <button className="bg-primary text-on-primary px-lg py-sm rounded-lg text-label-md hover:opacity-90 transition-opacity">
              Login
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}