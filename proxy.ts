import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
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

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
