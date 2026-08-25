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

  // Link prefetches (hover/viewport) only ever fetch the static loading
  // shell for dynamic routes like ours — the real, personalized content
  // streams in via a separate non-prefetch request when the user actually
  // navigates, which still runs this proxy and gets verified normally. So
  // there's no point paying supabase.auth.getUser()'s network round trip
  // to Supabase's Auth server for a prefetch: it can't affect what the
  // user ends up seeing, and skipping it here was the single biggest
  // source of "site feels slow while logged in" — every hovered/visible
  // link was firing an Auth-server round trip per request.
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

  const response = NextResponse.next({ request: { headers: requestHeaders } });
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
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
