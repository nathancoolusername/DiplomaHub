"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { strict } from "assert";

export default function ProfileDropdown({
  display_name,
  points,
  is_pro,
  sign_out,
  id,
}: {
  display_name: string;
  id: string;
  points: number;
  is_pro: boolean;
  sign_out: Function;
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
        <span className="text-body-lg text-primary font-bold font-serif flex flex-col">
          {display_name} · {points}pts{" "}
          {is_pro && (
            <h1 className="text-on-primary-fixed-variant text-label-md self-start font-bold">
              {is_pro ? "Diploma Pro" : ""}
            </h1>
          )}
        </span>
        <ChevronDown
          size={30}
          className={`text-on-primary-fixed-variant font-bold transition-transform ${isOpen ? "rotate-180" : ""}`}
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
