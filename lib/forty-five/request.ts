import "server-only";

import { resolveOrigin } from "@/app/lib/resolveOrigin";

// Forty-Five's POST routes carry the session cookie, so refuse cross-site
// requests: the Origin must be ours and the body must be JSON (a cross-site
// JSON POST can't skip the CORS preflight).
export function sameOriginJson(req: Request): boolean {
  if (!req.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return false;
  const origin = req.headers.get("origin");
  return !!origin && origin === resolveOrigin(req.headers);
}

const isWord = (w: unknown): w is string => typeof w === "string" && w.length > 0 && w.length <= 60;
export const isGuess = (x: unknown): x is string[] => Array.isArray(x) && x.length === 4 && x.every(isWord);
export const isLog = (x: unknown): x is string[][] => Array.isArray(x) && x.length <= 20 && x.every(isGuess);
