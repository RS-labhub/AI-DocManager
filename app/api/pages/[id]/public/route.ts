/* ═══════════════════════════════════════════════════════════════
   GET /api/pages/[id]/public — anonymous read for public pages
   ═══════════════════════════════════════════════════════════════
   Returns the page only when its visibility is "public_link". No
   auth cookie required. The response is intentionally trimmed to
   what a viewer needs (no share list, no internal fields).

   Security:
   - Only `visibility = 'public_link'` pages are returned. Anything
     else falls through to 404 to avoid leaking existence.
   - Rate-limited by IP to discourage enumeration.
   - Archived pages are not served publicly.
   ═══════════════════════════════════════════════════════════════ */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uuid } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth/require";
import type { Page } from "@/lib/supabase/types";

export const runtime = "nodejs";

interface RouteCtx {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const parsed = uuid.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ip = getClientIp(req);
  const rl = await checkRateLimit("page-public-read", ip, 60, 60);
  if (rl) return rl;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pages")
    .select(
      "id, title, emoji, cover_url, content, markdown_cache, visibility, is_archived, updated_at, created_at"
    )
    .eq("id", parsed.data)
    .maybeSingle();

  if (error) {
    console.error("[GET /api/pages/:id/public]", error);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Collapse all "can't view" cases into 404 to avoid leaking existence.
  if (!data || data.is_archived || data.visibility !== "public_link") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    page: data as Pick<
      Page,
      | "id"
      | "title"
      | "emoji"
      | "cover_url"
      | "content"
      | "markdown_cache"
      | "visibility"
      | "is_archived"
      | "updated_at"
      | "created_at"
    >,
  });
}
