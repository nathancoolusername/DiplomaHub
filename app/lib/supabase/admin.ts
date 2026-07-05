// lib/supabase/admin.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// NEVER import this file in a Client Component or expose SUPABASE_SERVICE_ROLE_KEY to the browser
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // no NEXT_PUBLIC_ prefix — server-only
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
