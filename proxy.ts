import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";

// Gates the last_active_at write on a cookie rather than a DB read, so the
// throttle check itself never touches the database — a session with 50
// page views in a day still costs exactly one write, not 50.
const LAST_ACTIVE_COOKIE = "la-ping";
const LAST_ACTIVE_COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const requestHeaders = new Headers(request.headers);

  // /dashboard is only ever reached through the `/` rewrite below, which
  // doesn't re-run this proxy. Anyone requesting it directly goes home.
  if (request.nextUrl.pathname === "/dashboard") {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    return NextResponse.redirect(home);
  }

  // Link prefetches (hover/viewport) only ever fetch the static loading
  // shell for dynamic routes like ours — the real, personalized content
  // streams in via a separate non-prefetch request when the user actually
  // navigates, which still runs this proxy and gets verified normally. So
  // there's no point paying for getClaims() on a prefetch. They still have
  // to come through here rather than be skipped by the matcher: when they
  // bypassed the proxy, the client router cached the bypassed responses and
  // signed-in navigation broke (blank practice pages, the signed-out home
  // after clicking the logo) until a full reload.
  if (request.headers.get("next-router-prefetch")) {
    requestHeaders.delete("x-verified-user-id");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let pendingCookies: { name: string; value: string; options: CookieOptions }[] =
    [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          pendingCookies = cookiesToSet;
        },
      },
    },
  );

  // getClaims() verifies the JWT's signature locally via WebCrypto against
  // our project's asymmetric (ECC) signing key, fetched once from Supabase's
  // edge-cached JWKS endpoint and reused across requests — unlike getUser(),
  // it doesn't make a round trip to the Auth server on every request. Any
  // leftover token still signed by the old (pre-migration) HS256 secret
  // transparently falls back to the getUser() network check instead of
  // failing, so this is safe even if a handful of very old sessions remain.
  const { data } = await supabase.auth.getClaims();

  // Downstream Server Components (starting with the root layout's navbar,
  // which renders on every page) can trust this instead of independently
  // verifying the session again. This header is always overwritten here,
  // after this point, so nothing a client sends can spoof it — proxy.ts
  // runs first on every matched request.
  if (data?.claims.sub) {
    requestHeaders.set("x-verified-user-id", data.claims.sub);
  } else {
    requestHeaders.delete("x-verified-user-id");
  }

  // The signed-out homepage at `/` is static and served from the CDN, so a
  // verified session gets the signed-in dashboard instead via a rewrite —
  // the browser still shows `/`. Only a verified sub counts: an expired or
  // forged cookie falls through to the static page like any visitor.
  const showDashboard =
    !!data?.claims.sub && request.nextUrl.pathname === "/";
  let response: NextResponse;
  if (showDashboard) {
    const dashboard = request.nextUrl.clone(); // keeps the query string
    dashboard.pathname = "/dashboard";
    response = NextResponse.rewrite(dashboard, {
      request: { headers: requestHeaders },
    });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );

  // Real (non-prefetch) navigation from a logged-in user, and it's been a
  // while since we last recorded activity for them — update in the
  // background via waitUntil so this never adds latency to the response,
  // and the cookie means the write only happens ~once/day/user regardless
  // of how many pages they view.
  if (data?.claims.sub && !request.cookies.has(LAST_ACTIVE_COOKIE)) {
    response.cookies.set(LAST_ACTIVE_COOKIE, "1", {
      maxAge: LAST_ACTIVE_COOKIE_MAX_AGE,
      path: "/",
    });
    event.waitUntil(
      Promise.resolve(
        supabase
          .from("users")
          .update({ last_active_at: new Date().toISOString() })
          .eq("id", data.claims.sub),
      ).then(
        () => {},
        () => {},
      ),
    );
    // One row per student per day, for the admin graphs of active and
    // returning students (migration 19). Same cookie gate, same silent failure.
    event.waitUntil(
      Promise.resolve(supabase.rpc("record_activity")).then(
        () => {},
        () => {},
      ),
    );
  }

  return response;
}

// Vercel checks `has`/`missing` while routing, before invoking anything, so
// requests that fail them never start this function. Each run of the proxy
// was costing CPU even when it immediately returned. It's only invoked for
// requests carrying the Supabase auth cookie (one entry for the plain name,
// one for the chunked `.0` name used when the session is large). Logged-out
// visitors and bots, including the static signed-out `/`, skip it. Don't add
// a `missing` prefetch condition: see the prefetch early return above.
// Skipped requests don't get a client-sent x-verified-user-id stripped, so
// getCurrentUserId() (app/lib/get-current-user.ts) only trusts that header
// when the auth cookie is present — keep the cookie names in sync with it. The calendar feed authenticates by its own URL token, and
// sitemap/robots/static files don't touch the session at all.
export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|api/calendar|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|woff|woff2|ttf|otf|pdf|map)$).*)",
      has: [{ type: "cookie", key: "sb-gmfqdkbghbxdlxffwfca-auth-token" }],
    },
    {
      source:
        "/((?!_next/static|_next/image|api/calendar|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|woff|woff2|ttf|otf|pdf|map)$).*)",
      has: [{ type: "cookie", key: "sb-gmfqdkbghbxdlxffwfca-auth-token.0" }],
    },
  ],
};
