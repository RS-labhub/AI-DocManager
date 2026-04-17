/* ═══════════════════════════════════════════════════════════════
   Supabase USER-SCOPED server client
   ═══════════════════════════════════════════════════════════════
   Used in Route Handlers, Server Actions, and Server Components.
   Reads/writes are bound to the current user's session via
   cookies, and are subject to RLS.

   For admin / service-role operations, import createAdminClient
   from "./admin" instead, AFTER a requireRole() check.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Create a user-scoped Supabase client for use in Server Components,
 * Route Handlers, and Server Actions. Binds to the incoming cookie
 * session. RLS is enforced.
 *
 * In Next.js 15+/16+ `cookies()` is async, so this helper is async.
 */
export async function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const cookieStore = await cookies();

  return createSsrServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — safe to ignore when
          // proxy.ts is refreshing sessions on every request.
        }
      },
    },
  });
}
