/* ═══════════════════════════════════════════════════════════════
   Server-side authorization helpers
   ═══════════════════════════════════════════════════════════════
   Every API route / Server Action MUST start with one of these
   helpers. They derive identity from the Supabase cookie session —
   never from the request body or query string.

   On failure they throw a Response, which the route handler can
   either let bubble up (Next will return it) or catch. For
   ergonomics, most callers wrap the body in `withAuth()` below.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAtLeast } from "@/lib/permissions";
import type { Profile, UserRole } from "@/lib/supabase/types";

/* ─── Error type: a thrown NextResponse short-circuits the route ── */

export class AuthError extends Error {
  response: NextResponse;
  constructor(response: NextResponse) {
    super(`AuthError ${response.status}`);
    this.response = response;
  }
}

function unauthorized(msg = "Authentication required") {
  return new AuthError(NextResponse.json({ error: msg }, { status: 401 }));
}

function forbidden(msg = "Forbidden") {
  return new AuthError(NextResponse.json({ error: msg }, { status: 403 }));
}

/* ─── Core: resolve the current user from the cookie session ──── */

export interface AuthedUser {
  id: string;
  email: string;
  profile: Profile;
}

/**
 * Resolve the calling user from the Supabase cookie session.
 * Throws AuthError(401) if unauthenticated.
 * Throws AuthError(403) if the profile is inactive, pending, or rejected.
 */
export async function requireUser(): Promise<AuthedUser> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw unauthorized();
  }

  // Load the full profile (role, org, status) — use the user-scoped
  // client so RLS is enforced (a user can always read their own profile).
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileErr || !profile) {
    throw forbidden("Profile not found");
  }

  if (!profile.is_active) {
    throw forbidden("Account is disabled");
  }

  if (profile.approval_status === "pending") {
    throw forbidden("Account is pending approval");
  }

  if (profile.approval_status === "rejected") {
    throw forbidden("Account is rejected");
  }

  return {
    id: user.id,
    email: user.email ?? profile.email,
    profile: profile as Profile,
  };
}

/**
 * Like requireUser but enforces a minimum role tier.
 */
export async function requireRole(min: UserRole): Promise<AuthedUser> {
  const authed = await requireUser();
  if (!isAtLeast(authed.profile.role, min)) {
    throw forbidden("Insufficient permissions");
  }
  return authed;
}

/**
 * Ensure the caller belongs to the given org, OR is `god`.
 * Useful for org-scoped routes.
 */
export async function requireOrgAccess(orgId: string | null | undefined): Promise<AuthedUser> {
  const authed = await requireUser();
  if (authed.profile.role === "god") return authed;
  if (!orgId) throw forbidden("Missing org scope");
  if (authed.profile.org_id !== orgId) {
    throw forbidden("Cross-org access denied");
  }
  return authed;
}

/* ─── Ergonomic wrapper ──────────────────────────────────────── */

type Handler<TArgs extends unknown[]> = (
  authed: AuthedUser,
  ...args: TArgs
) => Promise<Response> | Response;

/**
 * Wrap a Route Handler body with automatic auth + AuthError → Response
 * conversion + generic error handling.
 *
 *   export const POST = withAuth(async (authed, req) => {
 *     const body = mySchema.parse(await req.json());
 *     ...
 *   });
 */
export function withAuth<TArgs extends unknown[]>(
  handler: Handler<TArgs>,
  opts: { role?: UserRole } = {}
) {
  return async (...args: TArgs): Promise<Response> => {
    try {
      const authed = opts.role
        ? await requireRole(opts.role)
        : await requireUser();
      return await handler(authed, ...args);
    } catch (err) {
      if (err instanceof AuthError) return err.response;
      console.error("[withAuth] Unhandled route error:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

/* ─── IP extraction for audit logs ───────────────────────────── */

export function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}
