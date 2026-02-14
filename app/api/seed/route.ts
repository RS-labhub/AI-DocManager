import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

const DEFAULT_PASSWORD = "Password123!";

/**
 * GET /api/seed
 * Seeds the database with initial data including proper bcrypt hashes.
 * Only works if no profiles exist yet (prevents accidental re-seeding).
 */
export async function GET() {
  try {
    const supabase = createServerClient();

    // Check if already seeded
    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (existingProfiles && existingProfiles.length > 0) {
      return NextResponse.json(
        { message: "Database already seeded. Delete all data first to re-seed." },
        { status: 409 }
      );
    }

    // Hash the default password
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // ─── Organizations ─────────────────────────────────────
    const orgs = [
      { id: "00000000-0000-0000-0000-000000000001", name: "Acme Corporation", slug: "acme", org_code: "ACME2026", description: "The Acme Corporation — makers of everything" },
      { id: "00000000-0000-0000-0000-000000000002", name: "Globex Industries", slug: "globex", org_code: "GLOBEX01", description: "Globex — pushing the boundaries of innovation" },
      { id: "00000000-0000-0000-0000-000000000003", name: "Initech Labs", slug: "initech", org_code: "INIT3CHX", description: "Initech — enterprise solutions" },
    ];

    const { error: orgErr } = await supabase.from("organizations").insert(orgs);
    if (orgErr) throw new Error(`Org insert failed: ${orgErr.message}`);

    // ─── Profiles ──────────────────────────────────────────
    const profiles = [
      { id: "10000000-0000-0000-0000-000000000001", email: "god@system.local", full_name: "System God", role: "god" as const, org_id: null, is_active: true },
      { id: "20000000-0000-0000-0000-000000000001", email: "superadmin@acme.com", full_name: "Alice Wong", role: "super_admin" as const, org_id: "00000000-0000-0000-0000-000000000001", is_active: true },
      { id: "20000000-0000-0000-0000-000000000002", email: "superadmin@globex.com", full_name: "Bob Martinez", role: "super_admin" as const, org_id: "00000000-0000-0000-0000-000000000002", is_active: true },
      { id: "30000000-0000-0000-0000-000000000001", email: "admin@acme.com", full_name: "Carol Chen", role: "admin" as const, org_id: "00000000-0000-0000-0000-000000000001", is_active: true },
      { id: "30000000-0000-0000-0000-000000000002", email: "admin@globex.com", full_name: "David Kim", role: "admin" as const, org_id: "00000000-0000-0000-0000-000000000002", is_active: true },
      { id: "30000000-0000-0000-0000-000000000003", email: "admin@initech.com", full_name: "Eve Johnson", role: "admin" as const, org_id: "00000000-0000-0000-0000-000000000003", is_active: true },
      { id: "40000000-0000-0000-0000-000000000001", email: "user1@acme.com", full_name: "Frank Lee", role: "user" as const, org_id: "00000000-0000-0000-0000-000000000001", is_active: true },
      { id: "40000000-0000-0000-0000-000000000002", email: "user2@acme.com", full_name: "Grace Park", role: "user" as const, org_id: "00000000-0000-0000-0000-000000000001", is_active: true },
      { id: "40000000-0000-0000-0000-000000000003", email: "user1@globex.com", full_name: "Hank Wilson", role: "user" as const, org_id: "00000000-0000-0000-0000-000000000002", is_active: true },
      { id: "40000000-0000-0000-0000-000000000004", email: "user1@initech.com", full_name: "Ivy Nguyen", role: "user" as const, org_id: "00000000-0000-0000-0000-000000000003", is_active: true },
    ];

    // Create Supabase Auth users first (profiles.id references auth.users.id)
    for (const p of profiles) {
      const { error: authErr } = await supabase.auth.admin.createUser({
        id: p.id,
        email: p.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: p.full_name },
      });
      if (authErr) throw new Error(`Auth user creation failed for ${p.email}: ${authErr.message}`);
    }

    const { error: profileErr } = await supabase.from("profiles").insert(profiles);
    if (profileErr) throw new Error(`Profile insert failed: ${profileErr.message}`);

    // ─── Credentials ───────────────────────────────────────
    const credentials = profiles.map((p) => ({
      user_id: p.id,
      password_hash: hash,
    }));

    const { error: credErr } = await supabase.from("credentials").insert(credentials);
    if (credErr) throw new Error(`Credential insert failed: ${credErr.message}`);

    // ─── Documents ─────────────────────────────────────────
    const docs = [
      {
        title: "Getting Started Guide",
        content: "Welcome to the AI Document Management System. This guide covers document management, AI-powered analysis, role-based access control, and organization-scoped workflows.",
        owner_id: "20000000-0000-0000-0000-000000000001",
        org_id: "00000000-0000-0000-0000-000000000001",
        is_public: true,
        tags: ["guide", "onboarding"],
      },
      {
        title: "Security Policy",
        content: "This document outlines security policies including data encryption at rest and in transit, role-based access control with four-tier hierarchy, organization isolation, and audit logging.",
        owner_id: "20000000-0000-0000-0000-000000000001",
        org_id: "00000000-0000-0000-0000-000000000001",
        is_public: false,
        tags: ["security", "policy"],
      },
      {
        title: "Product Roadmap Q1 2026",
        content: "Q1 2026 Roadmap: Enhanced AI document parsing, multi-organization support, advanced permission management, real-time collaboration, mobile-responsive dashboard.",
        owner_id: "30000000-0000-0000-0000-000000000001",
        org_id: "00000000-0000-0000-0000-000000000001",
        is_public: false,
        tags: ["roadmap", "planning"],
      },
      {
        title: "Globex Innovation Brief",
        content: "Globex pioneers next-generation AI integration for enterprise document workflows combining fine-grained authorization with intelligent document processing.",
        owner_id: "20000000-0000-0000-0000-000000000002",
        org_id: "00000000-0000-0000-0000-000000000002",
        is_public: true,
        tags: ["innovation", "brief"],
      },
      {
        title: "Initech Compliance Report",
        content: "Annual compliance report covering GDPR, SOC2, and ISO 27001. All systems audited and meet required standards.",
        owner_id: "30000000-0000-0000-0000-000000000003",
        org_id: "00000000-0000-0000-0000-000000000003",
        is_public: false,
        tags: ["compliance", "report"],
      },
    ];

    const { error: docErr } = await supabase.from("documents").insert(docs);
    if (docErr) throw new Error(`Document insert failed: ${docErr.message}`);

    // ─── AI Agents ─────────────────────────────────────────
    const agents = [
      {
        name: "Document Assistant",
        description: "Helps with document organization, summarization, and basic tasks",
        role: "assistant",
        capabilities: ["read_documents", "suggest_edits", "summarize_content"],
        org_id: "00000000-0000-0000-0000-000000000001",
        created_by: "20000000-0000-0000-0000-000000000001",
        is_active: true,
      },
      {
        name: "Content Editor",
        description: "AI that can edit and improve document content with suggestions",
        role: "editor",
        capabilities: ["read_documents", "edit_documents", "generate_content"],
        org_id: "00000000-0000-0000-0000-000000000001",
        created_by: "20000000-0000-0000-0000-000000000001",
        is_active: true,
      },
      {
        name: "Document Analyzer",
        description: "Analyzes document content and provides deep insights",
        role: "analyzer",
        capabilities: ["read_documents", "analyze_content", "summarize_content"],
        org_id: "00000000-0000-0000-0000-000000000002",
        created_by: "20000000-0000-0000-0000-000000000002",
        is_active: true,
      },
    ];

    const { error: agentErr } = await supabase.from("ai_agents").insert(agents);
    if (agentErr) throw new Error(`Agent insert failed: ${agentErr.message}`);

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      data: {
        organizations: orgs.length,
        profiles: profiles.length,
        documents: docs.length,
        agents: agents.length,
        defaultPassword: DEFAULT_PASSWORD,
      },
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}
