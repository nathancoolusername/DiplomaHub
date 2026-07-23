"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { DiplomaProBadge } from "@/components/DiplomaProBadge";

export default function ProfileDropdown({
  display_name,
  points,
  is_pro,
  sign_out,
  id,
  isAdmin,
}: {
  display_name: string;
  id: string;
  points: number;
  is_pro: boolean;
  sign_out: () => void;
  isAdmin?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className=" flex flex-row cursor-pointer text-body-md text-on-surface hover:border-primary transition-colors w-full justify-between"
      >
        <span className="text-body-lg text-primary font-bold font-serif flex flex-col min-w-0">
          <span className="break-words">
            {display_name}
            <span className="hidden sm:inline"> · {points}pts</span>
          </span>
          {is_pro && (
            <DiplomaProBadge className="hidden sm:block text-on-primary-fixed-variant text-label-md self-start font-bold" />
          )}
        </span>
        <ChevronDown
          size={22}
          className={`shrink-0 text-on-primary-fixed-variant font-bold transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-xs bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md z-10 min-w-full overflow-hidden`}
        >
          <Link href={`/profile/${id}`}>
            <button
              onClick={() => {
                setIsOpen(false);
              }}
              className={`cursor-pointer w-full text-left px-md py-sm text-body-lg transition-colors hover:bg-surface-container text-primary font-serif`}
            >
              See profile
            </button>
          </Link>
          {isAdmin && (
            <Link href="/admin">
              <button
                onClick={() => {
                  setIsOpen(false);
                }}
                className={`cursor-pointer w-full text-left px-md py-sm text-body-lg transition-colors hover:bg-surface-container text-primary font-serif`}
              >
                Admin
              </button>
            </Link>
          )}
          <button
            onClick={() => {
              setIsOpen(false);
              sign_out();
            }}
            className={`cursor-pointer w-full text-left px-md py-sm text-body-lg transition-colors hover:bg-surface-container text-red-500 font-serif`}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
