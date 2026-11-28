"use client";

import { useState } from "react";
import { Info } from "lucide-react";

// A real DiplomaPro review (a Maths AA HL IA, shared by its author), shown on
// the signed-out /pro page. Quotes are short excerpts only: the IA itself is
// never published, so it can't turn up in a similarity check against its author.

type Kind = "strength" | "issue" | "suggestion";

const KIND: Record<Kind, { label: string; className: string }> = {
  strength: { label: "Works", className: "bg-primary-fixed text-on-primary-fixed" },
  issue: { label: "Fix", className: "bg-error-container text-on-error-container" },
  suggestion: { label: "Idea", className: "bg-surface-container-high text-on-surface" },
};

type Criterion = {
  id: string;
  name: string;
  max: number;
  mark: number;
  why: string;
  works: string[];
  raise: string[];
  comments: { page: number; kind: Kind; quote: string; comment: string }[];
};

const CRITERIA: Criterion[] = [
  {
    id: "A",
    name: "Presentation",
    max: 4,
    mark: 3,
    why: "Well organised, with an introduction, a stated aim, logically ordered sections and a conclusion. Held back from 4 because the aim (“land higher or lower”) is only partly met, the restriction to uphill throws is never stated, and the diagram contradicts the model.",
    works: ["Logical progression: model, range formula, optimisation, sensitivity, conclusion.", "Each section ends with an interpretation that links back to the aim."],
    raise: ["Make the diagram, the equations and the aim describe the same situation, or state clearly that only the uphill case is covered and why."],
    comments: [
      { page: 2, kind: "issue", quote: "9. Appendix", comment: "There is no appendix in the document. Remove this entry or add the content." },
      { page: 3, kind: "issue", quote: "since the object can land higher or lower", comment: "This promises both uphill and downhill landings, but your equations only model the uphill case. Either analyse both or state the restriction clearly." },
    ],
  },
  {
    id: "B",
    name: "Mathematical communication",
    max: 4,
    mark: 3,
    why: "Variables are defined in a table, several representations are used and the deductive layout is clear. A few inconsistencies stop it being consistent throughout: “horizontal” and “vertical” for rotated axes, a missing degree sign, and a Δθ axis labelled in metres.",
    works: ["Clear variables table defining θ, α, v, g, t, x, y and R.", "Step-by-step algebra, with identities stated before they are used."],
    raise: ["Choose one angle convention and fix the unit on the Graph 3 axis.", "State where v = 7 m/s comes from."],
    comments: [
      { page: 5, kind: "issue", quote: "Release speed of the projectile (7 m/s)", comment: "This value appears only in the table and is never justified or mentioned when you plot Graph 1. Where does 7 m/s come from?" },
      { page: 6, kind: "issue", quote: "The first one is for the horizontal motion", comment: "With rotated axes this is motion along the slope, not horizontal motion. The same applies to “vertical” for y." },
      { page: 16, kind: "issue", quote: "We can see how the tolerance window shrinks", comment: "The vertical axis of Graph 3 is labelled in metres, but Δθ is an angle." },
    ],
  },
  {
    id: "C",
    name: "Personal engagement",
    max: 3,
    mark: 2,
    why: "Authentic engagement on a few occasions drives the work forward: the backyard context, the reasoned choice of rotated axes, a self-devised 95% tolerance window. But the core problem is a standard textbook result, and the basketball context never tests or shapes the model.",
    works: ["The 95% tolerance window is an original way to quantify “margin for error”.", "States a prediction and compares it with the result."],
    raise: ["Does maximum range along the slope actually describe a shot at a raised hoop? Adapt the landing condition to a target, or justify why range is a fair proxy."],
    comments: [
      { page: 3, kind: "issue", quote: "my own variant of the compound angle formula", comment: "This is the standard product-to-sum identity. Deriving it is good, but calling it your own variant is inaccurate." },
      { page: 6, kind: "strength", quote: "chose this instead of just keeping the horizontal/vertical axes", comment: "A clear, reasoned modelling choice that makes the landing condition y = 0 simple." },
      { page: 12, kind: "strength", quote: "I will find the angles where the range falls to 95% of the maximum", comment: "An original, concrete way to quantify margin for error that directly addresses your research question." },
    ],
  },
  {
    id: "D",
    name: "Reflection",
    max: 3,
    mark: 2,
    why: "Reflection is meaningful: assumptions come with their consequences, boundary cases are checked, and the conclusion explains how drag would shift θ*. It is rarely critical, though. It doesn't question whether the model answers the basketball question, or notice the missing downhill case.",
    works: ["The boundary checks at α = 0° and α = 90° test the formula against known results.", "The conclusion explains the direction of the error from air resistance, not just that it exists."],
    raise: ["Actually quantify “reduced by a quantifiable amount”, and say whether Δθ decreases linearly."],
    comments: [
      { page: 4, kind: "strength", quote: "max range calculated in this investigation are overestimates", comment: "You state the direction of the error this assumption introduces, not just that it exists." },
      { page: 14, kind: "issue", quote: "for every degree of slope added", comment: "You say the reduction is quantifiable but never quantify it. Is the decrease in Δθ per degree constant? Your table lets you check." },
      { page: 16, kind: "issue", quote: "This explains why shooting a basketball is actually learnable", comment: "A basketball shot aims at a hoop above the ground, not at maximum range along the slope. Does your model support this claim?" },
    ],
  },
  {
    id: "E",
    name: "Use of mathematics",
    max: 6,
    mark: 4,
    why: "Relevant HL mathematics, correct for the uphill model, with the reasoning shown at each step: compound angle identities, optimisation confirmed by the derivative, a general Δθ formula. Not level 5 because the techniques are used in a fairly standard way and several claims lack rigour.",
    works: ["The product-to-sum identity is derived from the compound angle formulae rather than quoted.", "The Δθ derivation is general in α and correctly includes the second solution of the sine equation."],
    raise: ["Fix the sign issue and consider the downhill case: can one formula cover both directions?", "Justify the claims your argument relies on, like the monotonicity of Rmax."],
    comments: [
      { page: 6, kind: "issue", quote: "I resolved gravity into a perpendicular component", comment: "Your diagram shows the ball thrown downhill. In that direction, does the along-slope gravity component slow the ball or speed it up? Compare this with the sign you use in x(t)." },
      { page: 8, kind: "strength", quote: "I can now use the identity", comment: "Deriving the product-to-sum result from the compound angle formulae shows understanding rather than quoting." },
      { page: 11, kind: "suggestion", quote: "decreases monotonically as", comment: "The claim is true but unjustified. What property of sin α on your domain, or which derivative, would prove it?" },
      { page: 14, kind: "issue", quote: "become more asymmetric", comment: "Check this against your formula. For which values of θ is R(θ) zero? Where is the midpoint of those zeros, and how does it compare with θ*?" },
    ],
  },
];

const PRIORITIES = [
  { title: "Make the model consistent and cover the downhill case", criterion: "E" },
  { title: "Correct and justify your mathematical claims", criterion: "E" },
  { title: "Test the model against your basketball context and reflect critically", criterion: "D" },
];

const TOTAL = CRITERIA.reduce((s, c) => s + c.mark, 0);
const MAX = CRITERIA.reduce((s, c) => s + c.max, 0);

export function SampleReview() {
  const [selected, setSelected] = useState("E");
  const c = CRITERIA.find((x) => x.id === selected) ?? CRITERIA[0];

  return (
    <div className="rounded-3xl bg-surface-container-lowest border border-outline-variant p-md md:p-lg grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-lg">
      <div className="flex flex-col gap-md min-w-0">
        <div className="flex flex-col gap-xs">
          <p className="text-label-sm font-semibold text-on-surface-variant">Maths AA HL IA · Draft 1 · 17 pages</p>
          <p className="font-serif font-semibold text-body-lg text-on-surface">Optimising the release angle for maximum range of a projectile on a sloped surface</p>
        </div>
        <div>
          <p className="text-label-md text-on-surface-variant">Estimated mark</p>
          <p className="font-serif font-bold text-display-lg text-primary tabular-nums leading-none">
            {TOTAL}
            <span className="text-headline-md text-on-surface-variant"> / {MAX}</span>
          </p>
        </div>
        <ul className="flex flex-col gap-xs" role="radiogroup" aria-label="Criteria">
          {CRITERIA.map((x) => {
            const on = x.id === selected;
            return (
              <li key={x.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSelected(x.id)}
                  className={`w-full text-left rounded-xl px-sm py-xs flex flex-col gap-1 border transition-colors cursor-pointer ${
                    on ? "border-primary bg-surface-container-low" : "border-transparent hover:bg-surface-container-low"
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-sm">
                    <span className="text-label-md font-semibold text-on-surface">
                      {x.id}. {x.name}
                    </span>
                    <span className="text-label-md font-bold text-primary tabular-nums shrink-0">
                      {x.mark}
                      <span className="font-normal text-on-surface-variant">/{x.max}</span>
                    </span>
                  </span>
                  <span className="h-1.5 rounded-full bg-surface-container overflow-hidden" aria-hidden="true">
                    <span className="block h-full bg-primary rounded-full" style={{ width: `${(x.mark / x.max) * 100}%` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-xs">
          <p className="text-label-md font-semibold text-on-surface">Your next three changes</p>
          <ol className="flex flex-col gap-xs">
            {PRIORITIES.map((p, i) => (
              <li key={p.title} className="text-body-md text-on-surface-variant">
                <span className="font-semibold text-on-surface">{i + 1}.</span> {p.title} <span className="text-label-sm">({p.criterion})</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="flex flex-col gap-md min-w-0" aria-live="polite">
        <div className="flex flex-col gap-sm">
          <h3 className="font-serif font-bold text-headline-md text-on-surface">
            {c.id}. {c.name}{" "}
            <span className="text-primary tabular-nums">
              {c.mark}
              <span className="text-body-md text-on-surface-variant">/{c.max}</span>
            </span>
          </h3>
          <p className="text-body-md text-on-surface">{c.why}</p>
          <div className="grid sm:grid-cols-2 gap-sm">
            <Points title="What works" items={c.works} />
            <Points title="To raise it" items={c.raise} />
          </div>
        </div>
        <div className="flex flex-col gap-sm">
          <p className="text-label-md font-semibold text-on-surface">Pinned to the pages</p>
          <ul className="flex flex-col gap-sm">
            {c.comments.map((m) => (
              <li key={m.quote} className="rounded-xl border border-outline-variant p-sm md:p-md flex flex-col gap-xs">
                <div className="flex items-center gap-sm">
                  <span className={`rounded-full px-sm py-0.5 text-label-sm font-semibold ${KIND[m.kind].className}`}>{KIND[m.kind].label}</span>
                  <span className="text-label-sm text-on-surface-variant">Page {m.page}</span>
                </div>
                <blockquote className="border-l-2 border-primary pl-sm text-label-md italic text-on-surface-variant">&ldquo;{m.quote}&rdquo;</blockquote>
                <p className="text-body-md text-on-surface">{m.comment}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-label-sm text-on-surface-variant flex gap-xs">
          <Info size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
          A real review, lightly shortened. 20 comments in all, each highlighted on the PDF itself. Bro asks questions instead of rewriting your work.
        </p>
      </div>
    </div>
  );
}

function Points({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-surface-container-low p-sm flex flex-col gap-0.5">
      <p className="text-label-md font-semibold text-on-surface">{title}</p>
      <ul className="list-disc pl-md text-body-md text-on-surface-variant flex flex-col gap-0.5">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
