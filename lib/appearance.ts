// Accent colours (free for everyone) and backgrounds (DiplomaPro, lib/plans.ts "backgrounds").
// The choice sits on <html> as data-accent / data-bg (globals.css swaps the
// primary colours and paints the background per theme), is kept in this
// browser so it shows before the page paints, and is saved to the account.

export const ACCENTS = [
  { id: "blue", name: "IB Blue", swatch: "#1a43bf", blurb: "The classic" },
  { id: "sage", name: "Sage", swatch: "#2f7a50", blurb: "Calm green" },
  { id: "tide", name: "Tide", swatch: "#0f7299", blurb: "Ocean blue" },
  { id: "orchid", name: "Orchid", swatch: "#8340b8", blurb: "Soft purple" },
  { id: "blossom", name: "Blossom", swatch: "#c03a78", blurb: "Pink" },
  { id: "ember", name: "Ember", swatch: "#c2561a", blurb: "Warm orange" },
] as const;

export const BACKDROPS = [
  { id: "plain", name: "Plain", preview: "linear-gradient(180deg, #f8f9ff, #eef1fb)" },
  { id: "dawn", name: "Dawn", preview: "linear-gradient(180deg, #ffffff 15%, #ffe2d6 60%, #ffc3d8 100%)" },
  { id: "aurora", name: "Aurora", preview: "radial-gradient(80% 70% at 20% 100%, #a6ebe2, transparent 75%), radial-gradient(80% 70% at 80% 100%, #b7c4ff, transparent 75%), linear-gradient(180deg, #ffffff, #eef6fb)" },
  { id: "dusk", name: "Dusk", preview: "linear-gradient(180deg, #ffffff 15%, #e4dcff 60%, #c3b2ff 100%)" },
] as const;

export type Accent = (typeof ACCENTS)[number]["id"];
export type Backdrop = (typeof BACKDROPS)[number]["id"];
export type Appearance = { accent: Accent; backdrop: Backdrop };

export const DEFAULT_APPEARANCE: Appearance = { accent: "blue", backdrop: "plain" };
export const APPEARANCE_KEY = "dh-appearance";

export const isAccent = (v: unknown): v is Accent => ACCENTS.some((a) => a.id === v);
export const isBackdrop = (v: unknown): v is Backdrop => BACKDROPS.some((b) => b.id === v);

/** Sets the attributes on <html> (the defaults have none). */
export function applyAppearance(a: Appearance): void {
  const el = document.documentElement;
  if (a.accent === "blue") el.removeAttribute("data-accent");
  else el.setAttribute("data-accent", a.accent);
  if (a.backdrop === "plain") el.removeAttribute("data-bg");
  else el.setAttribute("data-bg", a.backdrop);
}

export function readStoredAppearance(): Appearance {
  try {
    const v = JSON.parse(localStorage.getItem(APPEARANCE_KEY) ?? "null");
    return { accent: isAccent(v?.accent) ? v.accent : "blue", backdrop: isBackdrop(v?.backdrop) ? v.backdrop : "plain" };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function storeAppearance(a: Appearance): void {
  try {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(a));
  } catch {
    // Private mode or storage off: it still applies for this visit.
  }
  applyAppearance(a);
  window.dispatchEvent(new Event("dh-appearance"));
}

/** Runs in <head> before the page paints, so a chosen accent never flashes blue. */
export const APPEARANCE_SCRIPT = `(function(){try{var v=JSON.parse(localStorage.getItem(${JSON.stringify(APPEARANCE_KEY)})||"null")||{};var d=document.documentElement;if(${JSON.stringify(ACCENTS.map((a) => a.id).filter((id) => id !== "blue"))}.indexOf(v.accent)>=0)d.setAttribute("data-accent",v.accent);if(${JSON.stringify(BACKDROPS.map((b) => b.id).filter((id) => id !== "plain"))}.indexOf(v.backdrop)>=0)d.setAttribute("data-bg",v.backdrop);}catch(e){}})();`;
