import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Anon-key client with no cookie/session handling, for reads of public data
// inside unstable_cache scopes (which can't touch cookies()/headers()) and
// for pages that should stay static/ISR. RLS applies exactly as it does for
// a logged-out visitor, so only use it for data anyone may see.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
