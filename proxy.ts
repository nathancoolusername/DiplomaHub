import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Downstream Server Components (starting with the root layout's navbar,
  // which renders on every page) can trust this instead of independently
  // calling supabase.auth.getUser() again — that's a real network round
  // trip to Supabase's Auth server, and doing it twice per request (once
  // here, once in the page render) was doubling the "middleware" + "function"
  // Active CPU cost of every single page view. This header is always
  // overwritten here, after this point, so nothing a client sends can spoof
  // it — proxy.ts runs first on every matched request.
  if (user) {
    requestHeaders.set("x-verified-user-id", user.id);
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
