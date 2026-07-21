// app/auth/reset-password/route.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveOrigin } from "@/app/lib/resolveOrigin";

// Exchanges the recovery `code` from the password-reset email for a
// session, then hands off to /reset-password (the actual "set new
// password" form). Mirrors app/auth/callback/route.ts's shape — a Server
// Component can't set cookies during render, so this has to be a route
// handler, not part of the /reset-password page itself.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = resolveOrigin(request.headers);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/forgot-password?error=no_code`);
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(`${origin}/reset-password`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/forgot-password?error=oauth_failed`);
  }

  return response;
}
