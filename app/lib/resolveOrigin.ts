// Resolves the public-facing origin a request actually came in on.
// Needed because reverse proxies (e.g. VS Code's port-forwarding tunnel)
// set `x-forwarded-host`/`x-forwarded-proto` to the real external host,
// while the underlying connection Next.js sees is still plain localhost.
export function resolveOrigin(headers: Headers): string {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  const proto =
    headers.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
