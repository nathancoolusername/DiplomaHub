"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * A number that counts up from 0 the first time it scrolls into view.
 * The server renders the real number (no JavaScript, reduced motion and
 * search engines all see it); the browser resets it to 0 before paint.
 */
export function CountUp({ to, suffix = "", ms = 1600 }: { to: number; suffix?: string; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => `${Math.round(n).toLocaleString("en-GB")}${suffix}`;

  const reduce = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useLayoutEffect(() => {
    if (ref.current && !reduce()) ref.current.textContent = fmt(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, before paint
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce()) return;
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / ms);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out: fast, then settles
          el.textContent = fmt(to * eased);
          if (t < 1) frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fmt only depends on suffix
  }, [to, ms, suffix]);

  return (
    <span ref={ref} className="tabular-nums">
      {fmt(to)}
    </span>
  );
}
