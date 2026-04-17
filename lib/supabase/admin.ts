/* ═══════════════════════════════════════════════════════════════
   Supabase SERVICE-ROLE client — quarantined admin access
   ═══════════════════════════════════════════════════════════════
   Bypasses RLS. Import ONLY from code that has already authorized
   the caller with requireRole("admin" | "super_admin" | "god") or
   from server-only maintenance scripts.

   Rule of thumb: if this file's exports are used inside a handler
   that doesn't first call requireRole(), that handler is insecure.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let _cached: SupabaseClient<Database> | null = null;

/**
 * Returns a Supabase client authenticated with the service-role key.
 * This client bypasses Row Level Security. Use sparingly.
 */
export function createAdminClient(): SupabaseClient<Database> {
  if (_cached) return _cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  _cached = createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _cached;
}
