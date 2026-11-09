// Guards the "return to the page I came from" redirect param used by
// sign-in/OAuth against open-redirect abuse (e.g. next=https://evil.com or
// next=//evil.com, which browsers treat as protocol-relative) — only a
// same-site, root-relative path is ever honored.
export function isSafeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  // Browsers read "\" as "/" (so "/\evil.com" is "//evil.com"); no control characters either.
  if (/[\\\u0000-\u001f]/.test(next)) return null;
  return next;
}
