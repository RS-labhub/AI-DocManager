import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Look up the user by email
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password — stored as hashed in a separate lookup
    // We store password hashes in a `credentials` column or a dedicated table.
    // For simplicity, we use a `password_hash` field on profiles.
    // Check the password hash
    const { data: cred } = await supabase
      .from("credentials")
      .select("password_hash")
      .eq("user_id", profile.id)
      .single();

    if (!cred) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, cred.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check approval status — pending/rejected users cannot log in to dashboard
    if (profile.approval_status === "pending") {
      return NextResponse.json(
        { error: "Your organization membership is pending approval from a Super Admin. Please try again later.", approval_status: "pending", user: profile },
        { status: 403 }
      );
    }

    if (profile.approval_status === "rejected") {
      return NextResponse.json(
        { error: "Your organization membership request was rejected. Please contact the Super Admin for more information.", approval_status: "rejected" },
        { status: 403 }
      );
    }

    // Log the login in audit
    await supabase.from("audit_logs").insert({
      user_id: profile.id,
      action: "login",
      resource_type: "auth",
      details: { method: "email" },
      org_id: profile.org_id,
    });

    return NextResponse.json({ user: profile });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
