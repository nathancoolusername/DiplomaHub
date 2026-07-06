// app/auth/callback/route.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const response = NextResponse.redirect(`${origin}/`); // default target, overwritten below

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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
    }

    // check if this user still needs to finish their profile
    const { data: profile } = await supabase
      .from("users")
      .select("ib_year")
      .eq("id", data.user.id)
      .single();

    const destination = profile?.ib_year ? "/" : "/profile/edit";

    return NextResponse.redirect(`${origin}${destination}`, {
      headers: response.headers, // carry over the session cookies we set above
    });
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
