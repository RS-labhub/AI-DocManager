import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { syncUserToPermit } from "@/lib/permit";

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, org_slug } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: "Email, password, and full name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Find organization by slug (if provided)
    let orgId: string | null = null;
    if (org_slug) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", org_slug.toLowerCase().trim())
        .single();

      if (!org) {
        return NextResponse.json(
          { error: `Organization "${org_slug}" not found` },
          { status: 404 }
        );
      }
      orgId = org.id;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create profile
    const userId = uuidv4();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        role: "user",
        org_id: orgId,
        is_active: true,
      })
      .select()
      .single();

    if (profileError || !profile) {
      console.error("Profile creation error:", profileError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Store credentials
    const { error: credError } = await supabase
      .from("credentials")
      .insert({
        user_id: userId,
        password_hash: passwordHash,
      });

    if (credError) {
      // Rollback profile
      await supabase.from("profiles").delete().eq("id", userId);
      console.error("Credential storage error:", credError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "register",
      resource_type: "auth",
      details: { method: "email", org_slug },
      org_id: orgId,
    });

    // Sync user to Permit.io for policy-based authorization
    await syncUserToPermit(userId, email.toLowerCase().trim(), "user", orgId);

    return NextResponse.json({ user: profile }, { status: 201 });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
