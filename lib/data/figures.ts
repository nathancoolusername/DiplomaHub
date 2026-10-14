// Question figures: small inline SVG diagrams that go with a question's stem.
//
// Figures are stored as SVG text in `questions.figures` and rendered inline so
// they pick up the theme (they draw with `currentColor`). Inline SVG can carry
// script, so every figure goes through sanitizeFigures() on the server before
// it reaches the browser: only drawing elements and presentation attributes
// survive, and any url(...) must point inside the figure (e.g. an arrow marker).
//
// No "server-only" here so the Node import script can reuse it.

import sanitizeHtml from "sanitize-html";
import type { QuestionFigure } from "./types";

const TAGS = ["svg", "g", "path", "line", "polyline", "polygon", "circle", "ellipse", "rect", "text", "tspan", "title", "defs", "marker"];
const ATTRS = [
  "viewBox", "width", "height", "xmlns", "preserveAspectRatio",
  "d", "x", "y", "dx", "dy", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "points",
  "fill", "fill-opacity", "stroke", "stroke-width", "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "stroke-opacity", "opacity",
  "transform", "text-anchor", "dominant-baseline", "font-size", "font-style", "font-weight", "font-family",
  "marker-start", "marker-mid", "marker-end", "id", "refX", "refY", "markerWidth", "markerHeight", "markerUnits", "orient",
];
const EXTERNAL_URL = /url\(\s*['"]?(?!#)/i;

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: TAGS,
  allowedAttributes: { "*": ATTRS },
  allowedSchemes: [],
  nonTextTags: ["script", "style", "foreignObject", "textarea", "noscript"],
  parser: { lowerCaseTags: false, lowerCaseAttributeNames: false, recognizeSelfClosing: true },
  selfClosing: ["path", "line", "polyline", "polygon", "circle", "ellipse", "rect"],
  transformTags: {
    "*": (tagName, attribs) => ({
      tagName,
      attribs: Object.fromEntries(Object.entries(attribs).filter(([, v]) => !EXTERNAL_URL.test(v))),
    }),
  },
};

export function sanitizeFigureSvg(svg: string): string {
  const clean = sanitizeHtml(svg, OPTIONS).trim();
  return clean.startsWith("<svg") ? clean : "";
}

/** Raw figures from the database or an export file → safe figures for the browser. Drops anything unusable. */
export function sanitizeFigures(raw: unknown): QuestionFigure[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f) => ({
      svg: typeof f?.svg === "string" ? sanitizeFigureSvg(f.svg) : "",
      alt: typeof f?.alt === "string" ? f.alt.slice(0, 1000) : "",
    }))
    .filter((f) => f.svg && f.alt);
}
