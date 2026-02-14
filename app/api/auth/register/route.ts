import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { syncUserToPermit } from "@/lib/permit";

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, org_code } = await req.json();

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

    // Check if email already exists in profiles
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

    // Determine org membership and approval status
    let orgId: string | null = null;
    let approvalStatus: "pending" | "approved" = "approved";

    if (org_code) {
      // Validate org code (alphanumeric)
      const trimmedCode = org_code.trim().toUpperCase();
      if (!/^[A-Z0-9]{4,16}$/.test(trimmedCode)) {
        return NextResponse.json(
          { error: "Organization code must be 4-16 alphanumeric characters" },
          { status: 400 }
        );
      }

      const { data: org } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("org_code", trimmedCode)
        .single();

      if (!org) {
        return NextResponse.json(
          { error: "Invalid organization code. Please check and try again." },
          { status: 404 }
        );
      }
      orgId = org.id;
      // Users joining an org need super-admin approval
      approvalStatus = "pending";
    }

    // Hash the password for the credentials table
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user in Supabase Auth (appears in Authentication → Users)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true,  // Auto-confirm, no email verification
      user_metadata: { full_name: full_name.trim() },
    });

    if (authError || !authData.user) {
      console.error("Supabase Auth user creation error:", authError);
      return NextResponse.json(
        { error: authError?.message || "Failed to create account" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Create profile (linked to auth.users.id)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        role: "user",
        org_id: orgId,
        approval_status: approvalStatus,
        is_active: true,
      })
      .select()
      .single();

    if (profileError || !profile) {
      // Rollback auth user
      await supabase.auth.admin.deleteUser(userId);
      console.error("Profile creation error:", profileError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Store credentials (bcrypt hash for custom login flow)
    const { error: credError } = await supabase
      .from("credentials")
      .insert({
        user_id: userId,
        password_hash: passwordHash,
      });

    if (credError) {
      // Rollback profile + auth user
      await supabase.from("profiles").delete().eq("id", userId);
      await supabase.auth.admin.deleteUser(userId);
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
      details: { method: "email", org_code: org_code || null, approval_status: approvalStatus },
      org_id: orgId,
    });

    // Sync user to Permit.io for policy-based authorization
    await syncUserToPermit(userId, email.toLowerCase().trim(), "user", orgId);

    return NextResponse.json({
      user: profile,
      pending: approvalStatus === "pending",
      message: approvalStatus === "pending"
        ? "Account created! Your request to join the organization is pending approval from a Super Admin."
        : undefined,
    }, { status: 201 });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
