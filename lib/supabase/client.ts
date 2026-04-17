/* ═══════════════════════════════════════════════════════════════
   Supabase BROWSER client — cookie-bound SSR-compatible
   ═══════════════════════════════════════════════════════════════
   Safe to import from "use client" components. Uses only the
   anon key; all reads/writes are subject to RLS, authenticated
   via the cookie session set by proxy.ts + the login flow.
   ═══════════════════════════════════════════════════════════════ */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
