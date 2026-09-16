// Guards the "return to the page I came from" redirect param used by
// sign-in/OAuth against open-redirect abuse (e.g. next=https://evil.com or
// next=//evil.com, which browsers treat as protocol-relative) — only a
// same-site, root-relative path is ever honored.
export function isSafeNext(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
