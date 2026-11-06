import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, SUPABASE_URL } from "@/lib/env";

/**
 * Service-role client. Only import this from server actions / route handlers.
 * Never pass its data to the browser. Used for rate limiting, analytics and
 * storage uploads where RLS cannot express the rule.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isSupabaseConfigured() || !serviceKey) {
    return null;
  }

  return createSupabaseClient(SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
