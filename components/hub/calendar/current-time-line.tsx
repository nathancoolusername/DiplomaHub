"use client";

import { useEffect, useState } from "react";
import { timeToY } from "./calendar-utils";

export default function CurrentTimeLine() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const top = timeToY(now);
  if (top < 0) return null;

  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
      style={{ top }}
      aria-hidden="true"
    >
      <div className="w-2 h-2 rounded-full bg-error -ml-1" />
      <div className="flex-1 h-px bg-error" />
    </div>
  );
}
