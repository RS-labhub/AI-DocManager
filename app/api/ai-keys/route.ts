import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { encryptApiKey, decryptApiKey } from "@/lib/encryption";

/* ─── GET: list user's API keys (masked) ─────────────────────── */

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("ai_api_keys")
    .select("id, provider, label, is_active, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ keys: data });
}

/* ─── POST: store a new encrypted API key ────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const { user_id, provider, api_key, label } = await req.json();

    if (!user_id || !provider || !api_key) {
      return NextResponse.json(
        { error: "user_id, provider, and api_key are required" },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const encrypted = encryptApiKey(api_key);

    const supabase = createServerClient();

    // Deactivate existing keys for the same provider
    await supabase
      .from("ai_api_keys")
      .update({ is_active: false })
      .eq("user_id", user_id)
      .eq("provider", provider);

    // Insert new key
    const { data, error } = await supabase
      .from("ai_api_keys")
      .insert({
        user_id,
        provider,
        encrypted_key: encrypted.encrypted_key,
        iv: encrypted.iv,
        auth_tag: encrypted.auth_tag,
        label: label || `${provider} key`,
        is_active: true,
      })
      .select("id, provider, label, is_active, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit
    await supabase.from("audit_logs").insert({
      user_id,
      action: "create",
      resource_type: "ai_api_key",
      resource_id: data.id,
      details: { provider },
    });

    return NextResponse.json({ key: data }, { status: 201 });
  } catch (err) {
    console.error("API key creation error:", err);
    return NextResponse.json(
      { error: "Failed to store API key" },
      { status: 500 }
    );
  }
}

/* ─── DELETE: remove an API key ──────────────────────────────── */

export async function DELETE(req: NextRequest) {
  const keyId = req.nextUrl.searchParams.get("id");
  const userId = req.nextUrl.searchParams.get("user_id");

  if (!keyId || !userId) {
    return NextResponse.json(
      { error: "id and user_id are required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const { error } = await supabase
    .from("ai_api_keys")
    .delete()
    .eq("id", keyId)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
