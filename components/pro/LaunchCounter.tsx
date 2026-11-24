"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Users } from "lucide-react";
import { TIERS, currentTier, euros, nextTier } from "@/lib/campaign";

// The launch campaign's live counter on /pro: counts up when it comes into
// view, fills towards the next price, ticks off the prices already unlocked,
// and checks for new sign-ups every minute while the page is open.

const sorted = [...TIERS].sort((a, b) => a.at - b.at);
const top = sorted[sorted.length - 1].at;

export function LaunchCounter({ initial }: { initial: number }) {
  const [joined, setJoined] = useState(initial);
  const [shown, setShown] = useState(0);
  const [visible, setVisible] = useState(false);
  const box = useRef<HTMLElement>(null);

  // Start the animation the first time the counter is on screen.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Count up (or on) to the latest number.
  useEffect(() => {
    if (!visible) return;
    // With reduced motion the number just appears (a zero-length animation).
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const from = shown;
    const start = performance.now();
    const ms = reduce ? 0 : Math.min(1600, 400 + Math.abs(joined - from) * 25);
    const tick = (now: number) => {
      const t = ms === 0 ? 1 : Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (joined - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from wherever the number is now
  }, [visible, joined]);

  // New sign-ups while the page is open.
  useEffect(() => {
    const poll = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/campaign", { cache: "no-store" });
        if (res.ok) {
          const body = (await res.json()) as { joined?: number };
          if (typeof body.joined === "number") setJoined(body.joined);
        }
      } catch {
        // keep the last number
      }
    };
    const t = setInterval(poll, 60_000);
    return () => clearInterval(t);
  }, []);

  const tier = currentTier(shown);
  const next = nextTier(shown);
  const prevAt = tier.at;
  const toNext = next ? Math.min(1, (shown - prevAt) / (next.at - prevAt)) : 1;
  const overall = Math.min(1, shown / top);

  return (
    <section ref={box} className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-lg md:p-xl flex flex-col gap-lg" aria-labelledby="price-heading">
      <div className="flex flex-col gap-xs">
        <h2 id="price-heading" className="font-serif font-bold text-headline-md text-on-surface">
          The launch price: the more of us, the cheaper
        </h2>
        <p className="text-body-md text-on-surface-variant">
          During the launch, the monthly price drops each time more students join, and everyone who joined pays the price the counter reaches, not the price on the day
          they joined. So bring your friends.
        </p>
      </div>

      <div className="grid gap-md md:grid-cols-[auto_1fr] md:items-end">
        <div className="flex flex-col">
          <span className="inline-flex items-center gap-xs text-label-md font-semibold text-on-surface-variant">
            <Users size={14} aria-hidden="true" /> Students joined
          </span>
          <span className="font-serif font-bold text-display-lg text-on-surface tabular-nums leading-none" aria-live="polite">
            {shown.toLocaleString("en-GB")}
          </span>
        </div>
        <div className="flex flex-col gap-xs min-w-0">
          <p className="text-body-md text-on-surface">
            Price now <span className="font-semibold">{euros(tier.price)}</span> a month
            {next ? (
              <>
                {" · "}
                <span className="font-semibold tabular-nums">{Math.max(0, next.at - shown)}</span> more until <span className="font-semibold">{euros(next.price)}</span>
              </>
            ) : (
              " · the lowest price is unlocked"
            )}
          </p>
          <div className="h-2.5 rounded-full bg-surface-container overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(toNext * 100)} aria-label="Progress to the next price">
            <div className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out" style={{ width: `${toNext * 100}%` }} />
          </div>
        </div>
      </div>

      <ol className="relative grid grid-cols-2 sm:grid-cols-4 gap-sm">
        {sorted.map((t) => {
          const reached = shown >= t.at;
          const isNow = t === tier;
          return (
            <li
              key={t.at}
              className={`rounded-2xl p-md flex flex-col gap-xs transition-colors ${
                isNow ? "bg-primary text-on-primary" : reached ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container-low text-on-surface"
              }`}
            >
              <span className="flex items-center gap-xs font-serif font-bold text-headline-md tabular-nums leading-none">
                {euros(t.price)}
                {reached && !isNow && <Check size={16} aria-label="unlocked" />}
              </span>
              <span className="text-label-sm opacity-80">{t.at === 0 ? "a month · to start" : `a month · ${t.at} students`}</span>
            </li>
          );
        })}
      </ol>
      <div className="h-1 rounded-full bg-surface-container overflow-hidden -mt-sm" aria-hidden="true">
        <div className="h-full rounded-full bg-primary/60 transition-[width] duration-700 ease-out" style={{ width: `${overall * 100}%` }} />
      </div>

      <p className="text-label-md text-on-surface-variant">
        The launch runs from 1 December until the winter break. After that, DiplomaPro is {euros(sorted[0].price)} a month. Monthly, or one price until your exams.
      </p>
    </section>
  );
}
