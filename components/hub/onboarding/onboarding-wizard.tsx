"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { SubjectId } from "../mock-data";
import StepWelcome from "./step-welcome";
import StepCalendar from "./step-calendar";
import StepTimerMilestones from "./step-timer-milestones";
import StepPickSubjects from "./step-pick-subjects";
import { CORE_SUBJECT_IDS, toggleWithCap } from "./subject-cap";

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

// Each step optionally spotlights one or more real elements on the page
// behind the wizard (matched by data-tour attribute) — the panel glides to
// sit next to whatever's lit up, and everything else dims. Step 0 has no
// target: it's the only step centered on the page as a whole.
const STEP_TARGETS: (string[] | null)[] = [
  null,
  ['[data-tour="calendar"]'],
  ['[data-tour="timer"]', '[data-tour="milestones"]'],
  ['[data-tour="subject-filter"]'],
];

const STEP_COUNT = STEP_TARGETS.length;
const PANEL_WIDTH = 380;
const ESTIMATED_PANEL_HEIGHT = 300;
const GAP = 20;
const MOBILE_BREAKPOINT = 768;

type Rect = { top: number; left: number; width: number; height: number };
type PanelPos = { top: number; left: number };

function unionRect(selectors: string[]): Rect | null {
  const rects = selectors
    .map((sel) => document.querySelector(sel)?.getBoundingClientRect())
    .filter((r): r is DOMRect => !!r && r.width > 0 && r.height > 0);
  if (!rects.length) return null;
  const top = Math.min(...rects.map((r) => r.top));
  const left = Math.min(...rects.map((r) => r.left));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  const right = Math.max(...rects.map((r) => r.right));
  return { top, left, width: right - left, height: bottom - top };
}

// `panelHeight` is the tour panel's real, current, measured height — not the
// ESTIMATED_PANEL_HEIGHT constant, which is only a fallback for the very
// first paint before the panel has ever been measured. Steps with more
// content (the calendar step's bullet list, in particular) render taller
// than that estimate, and using the estimate to compute `top` used to leave
// the panel positioned too low — with a spotlighted target as tall as the
// calendar (which itself can be taller than the viewport), roughly half the
// panel would render below the bottom of the screen. The clamp at the end
// is what actually guarantees the whole panel stays on screen; the
// above/below branch above it is just a starting placement heuristic.
function anchorPanel(target: Rect | null, panelHeight: number): PanelPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top: number;
  let left: number;

  if (!target) {
    top = vh / 2 - panelHeight / 2;
    left = vw / 2 - PANEL_WIDTH / 2;
  } else {
    const spaceBelow = vh - (target.top + target.height);
    const spaceAbove = target.top;
    const placeBelow = spaceBelow >= panelHeight || spaceBelow >= spaceAbove;
    top = placeBelow ? target.top + target.height + GAP : target.top - GAP - panelHeight;
    left = target.left + target.width / 2 - PANEL_WIDTH / 2;
  }

  top = Math.max(GAP, Math.min(top, vh - panelHeight - GAP));
  left = Math.max(GAP, Math.min(left, vw - PANEL_WIDTH - GAP));

  return { top, left };
}

export default function OnboardingWizard({
  onFinish,
  onSkip,
}: {
  onFinish: (subjectIds: SubjectId[] | null) => void;
  onSkip: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  // Every IB Diploma student takes both TOK and the Extended Essay, so they
  // start pre-checked — the user can still uncheck them, but starting from
  // "nothing selected" would make almost everyone do the same first click.
  const [selected, setSelected] = useState<Set<SubjectId>>(() => new Set(CORE_SUBJECT_IDS));
  const [spotlight, setSpotlight] = useState<Rect | null>(null);
  const [panelPos, setPanelPos] = useState<PanelPos | null>(null);

  // Re-measures the current step's target(s) and repositions both the
  // spotlight cutout and the panel next to it. Below the same breakpoint
  // the rest of the app switches to a stacked mobile layout at, the
  // calendar target is hidden (`hidden md:block`) and there usually isn't
  // room to float a card beside anything anyway — fall back to a plain
  // centered dialog for every step instead of chasing a moving target.
  useEffect(() => {
    const selectors = window.innerWidth >= MOBILE_BREAKPOINT ? STEP_TARGETS[step] : null;

    function measure() {
      const rect = selectors ? unionRect(selectors) : null;
      setSpotlight(rect);
      const panelHeight = dialogRef.current?.offsetHeight || ESTIMATED_PANEL_HEIGHT;
      setPanelPos(anchorPanel(rect, panelHeight));
    }

    if (selectors) {
      const primary = document.querySelector(selectors[0]);
      if (primary) {
        // A target taller than the viewport (the calendar, on a shorter
        // screen) can never be fully shown either way — but centering it
        // guarantees both its top and bottom run off screen, while aligning
        // to the top at least keeps one full edge (and the panel anchored
        // next to it) fully visible.
        const fitsViewport = primary.getBoundingClientRect().height <= window.innerHeight - GAP * 2;
        primary.scrollIntoView({ behavior: "smooth", block: fitsViewport ? "center" : "start" });
      }
    }

    measure();
    const settleTimer = setTimeout(measure, 350); // after the smooth scroll settles
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(settleTimer);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [step]);

  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null;
    getFocusable(dialogRef.current)[0]?.focus();
    return () => prevActive?.focus?.();
  }, []);

  // The tour drives page scroll itself (scrollIntoView per step) to keep
  // the spotlight and panel in sync — a user scrolling mid-transition races
  // that and leaves the spotlight measuring the wrong position. Block real
  // scroll input (wheel/touch/keys) for the page while the tour is open,
  // but let it through inside the panel itself in case its own content
  // ever needs to scroll.
  useEffect(() => {
    function blockWheelOrTouch(e: Event) {
      if (dialogRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
    }
    function blockScrollKeys(e: KeyboardEvent) {
      if (dialogRef.current?.contains(e.target as Node)) return;
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
        e.preventDefault();
      }
    }
    window.addEventListener("wheel", blockWheelOrTouch, { passive: false });
    window.addEventListener("touchmove", blockWheelOrTouch, { passive: false });
    window.addEventListener("keydown", blockScrollKeys);
    return () => {
      window.removeEventListener("wheel", blockWheelOrTouch);
      window.removeEventListener("touchmove", blockWheelOrTouch);
      window.removeEventListener("keydown", blockScrollKeys);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onSkip();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable(dialogRef.current);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSkip]);

  // Keep focus inside the panel as it hops between steps — otherwise focus
  // can be left behind on whatever was under the old spotlight.
  useLayoutEffect(() => {
    if (dialogRef.current?.contains(document.activeElement)) return;
    getFocusable(dialogRef.current)[0]?.focus();
  }, [step]);

  function toggleSubject(id: SubjectId) {
    setSelected((prev) => toggleWithCap(prev, id));
  }

  function handleNext() {
    if (step === STEP_COUNT - 1) {
      onFinish(selected.size > 0 ? Array.from(selected) : null);
      return;
    }
    setStep((s) => s + 1);
  }

  return createPortal(
    <div className="fixed inset-0 z-100">
      {/* Catches clicks anywhere outside the panel — including over a
          spotlighted element, since the real page stays non-interactive
          for the duration of the tour — and treats them as Skip. */}
      <div className="absolute inset-0" onClick={onSkip} aria-hidden="true" />

      {/* The dim layer. With a target, a transparent "hole" the size of the
          target is punched via a box-shadow, whose top/left/width/height
          transition smoothly on every step change — that's the whole
          "spotlight moves as you click Next" effect, no animation library
          needed. Without a target (step 0, or the mobile fallback) it's
          just a flat dim. */}
      {spotlight ? (
        <div
          aria-hidden="true"
          className="absolute rounded-xl pointer-events-none transition-all duration-500 ease-in-out"
          style={{
            top: spotlight.top - 8,
            left: spotlight.left - 8,
            width: spotlight.width + 16,
            height: spotlight.height + 16,
            boxShadow: "0 0 0 9999px rgba(11,28,48,0.7)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-on-surface/40" aria-hidden="true" />
      )}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="fixed bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl max-h-[85vh] overflow-y-auto p-lg flex flex-col gap-lg transition-all duration-500 ease-in-out"
        style={{
          top: panelPos?.top ?? "50%",
          left: panelPos?.left ?? "50%",
          width: PANEL_WIDTH,
          transform: panelPos ? undefined : "translate(-50%, -50%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: STEP_COUNT }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-outline-variant"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-1 text-label-md font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            Skip
            <X size={16} />
          </button>
        </div>

        <div id="onboarding-title">
          {step === 0 && <StepWelcome />}
          {step === 1 && <StepCalendar />}
          {step === 2 && <StepTimerMilestones />}
          {step === 3 && <StepPickSubjects selected={selected} onToggle={toggleSubject} />}
        </div>

        <div className="flex items-center justify-between pt-sm border-t border-outline-variant/50">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-md py-2 rounded-lg border border-outline-variant text-label-md font-semibold text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-0 disabled:pointer-events-none"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="px-lg py-2 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            {step === STEP_COUNT - 1 ? "Start planning" : "Next"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
