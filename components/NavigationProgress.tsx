"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// A thin bar at the top of the screen from the moment an internal link is
// clicked until the new page has arrived. It only appears when loading takes
// longer than SHOW_AFTER_MS, so fast pages don't flicker. It creeps towards
// 90% while waiting, fills when the URL changes, then fades out.

const SHOW_AFTER_MS = 120;
const GIVE_UP_MS = 15_000;

type Phase = "idle" | "waiting" | "running" | "done";

function isInternalNavigation(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element | null)?.closest?.("a");
  if (!a || !a.href || a.target === "_blank" || a.hasAttribute("download")) return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return null;
  // Same page (or only a #hash change): nothing will load.
  if (url.pathname === location.pathname && url.search === location.search) return null;
  return url.pathname + url.search;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhaseState] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const setPhase = (p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  };
  const [width, setWidth] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const creep = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (creep.current) clearInterval(creep.current);
    creep.current = null;
  };

  // Start on an internal link click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!isInternalNavigation(e)) return;
      clearAll();
      setPhase("waiting");
      setWidth(0);
      timers.current.push(
        setTimeout(() => {
          setPhase("running");
          setWidth(15);
          creep.current = setInterval(() => setWidth((w) => (w < 90 ? w + (90 - w) * 0.08 : w)), 200);
        }, SHOW_AFTER_MS),
        // A navigation that never lands (e.g. an error page) shouldn't leave the bar up.
        setTimeout(() => {
          clearAll();
          setPhase("idle");
        }, GIVE_UP_MS),
      );
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearAll();
    };
  }, []);

  // Finish when the URL has changed.
  useEffect(() => {
    const t = setTimeout(() => {
      clearAll();
      if (phaseRef.current === "running") {
        setWidth(100);
        setPhase("done");
        timers.current.push(setTimeout(() => setPhase("idle"), 300));
      } else {
        setPhase("idle");
      }
    }, 0);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  if (phase === "idle" || phase === "waiting") return null;
  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[200] h-0.5 pointer-events-none">
      <div
        className={`h-full bg-primary shadow-[0_0_8px_var(--color-primary)] transition-[width,opacity] ease-out ${
          phase === "done" ? "opacity-0 duration-300" : "opacity-100 duration-200"
        }`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
