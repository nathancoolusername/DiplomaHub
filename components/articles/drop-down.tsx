"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function SortDropdown({
  selected,
  handleClick,
  options,
  placeholder = "Select",
}: {
  selected: string;
  handleClick: Function;
  options: string[];
  placeholder?: string;
}) {
  const optionL = options.length > 4;
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
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer flex items-center gap-sm bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface hover:border-primary transition-colors w-full justify-between"
      >
        {selected ? (
          <span className="text-on-surface font-bold text-label-md">
            {selected}
          </span>
        ) : (
          <span className="text-on-surface font-bold text-label-md">
            {placeholder}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`text-outline transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-xs bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md z-100 min-w-full overflow-hidden ${optionL ? "overflow-y-scroll" : ""} h-40`}
        >
          {options.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => {
                handleClick(option);
                setIsOpen(false);
              }}
              className={`cursor-pointer w-full text-left px-md py-sm text-label-md transition-colors hover:bg-surface-container
                ${
                  selected === option
                    ? "text-primary font-bold bg-surface-container"
                    : "text-on-surface"
                }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
