"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Profile, UserRole, Organization } from "@/lib/supabase/types";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import {
  syncUserToPermit,
  removeUserFromPermit,
  updateUserRoleInPermit,
  checkPermission,
} from "@/lib/permit";

/* ═══════════════════════════════════════════════════════════════
   Organization Actions
   ═══════════════════════════════════════════════════════════════ */

export async function getOrganizations(): Promise<Organization[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching organizations:", error);
    return [];
  }
  return data || [];
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function createOrganization(
  payload: { name: string; slug: string; description?: string },
  creatorId: string
): Promise<{ success: boolean; org?: Organization; error?: string }> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: payload.name.trim(),
      slug: payload.slug.toLowerCase().trim(),
      description: payload.description?.trim() || null,
      logo_url: null,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from("audit_logs").insert({
    user_id: creatorId,
    action: "create",
    resource_type: "organization",
    resource_id: data.id,
    details: { name: data.name },
  });

  revalidatePath("/god");
  return { success: true, org: data };
}

export async function updateOrganization(
  id: string,
  payload: { name?: string; description?: string },
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("organizations")
    .update(payload)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: "update",
    resource_type: "organization",
    resource_id: id,
    details: payload,
  });

  revalidatePath("/god");
  return { success: true };
}

export async function deleteOrganization(
  id: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: userId,
    action: "delete",
    resource_type: "organization",
    resource_id: id,
    details: {},
  });

  revalidatePath("/god");
  return { success: true };
}

/* ═══════════════════════════════════════════════════════════════
   User / Profile Actions
   ═══════════════════════════════════════════════════════════════ */

export async function getUsers(orgId?: string): Promise<Profile[]> {
  const supabase = createServerClient();
  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });

  if (orgId) {
    query = query.eq("org_id", orgId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return data || [];
}

export async function getAllUsers(): Promise<Profile[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function getUser(id: string): Promise<Profile | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export async function createUser(
  payload: {
    email: string;
    full_name: string;
    password: string;
    role: UserRole;
    org_id: string | null;
  },
  creatorId: string
): Promise<{ success: boolean; user?: Profile; error?: string }> {
  const supabase = createServerClient();

  // Check duplicate email
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", payload.email.toLowerCase().trim())
    .single();

  if (existing) {
    return { success: false, error: "Email already in use" };
  }

  const userId = uuidv4();
  const hash = await bcrypt.hash(payload.password, 12);

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email: payload.email.toLowerCase().trim(),
      full_name: payload.full_name.trim(),
      role: payload.role,
      org_id: payload.org_id,
      is_active: true,
    })
    .select()
    .single();

  if (profileErr) return { success: false, error: profileErr.message };

  await supabase.from("credentials").insert({
    user_id: userId,
    password_hash: hash,
  });

  await supabase.from("audit_logs").insert({
    user_id: creatorId,
    action: "create_user",
    resource_type: "user",
    resource_id: userId,
    details: { email: payload.email, role: payload.role },
    org_id: payload.org_id,
  });

  // Sync new user to Permit.io
  await syncUserToPermit(userId, payload.email, payload.role, payload.org_id);

  revalidatePath("/dashboard/users");
  revalidatePath("/god");
  return { success: true, user: profile };
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  // Get old role for Permit.io sync
  const { data: user } = await supabase
    .from("profiles")
    .select("role, org_id")
    .eq("id", userId)
    .single();

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: actorId,
    action: "update_role",
    resource_type: "user",
    resource_id: userId,
    details: { new_role: newRole },
  });

  // Sync role change to Permit.io
  if (user) {
    await updateUserRoleInPermit(userId, user.role, newRole, user.org_id);
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/god");
  return { success: true };
}

export async function updateUserOrg(
  userId: string,
  orgId: string | null,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("profiles")
    .update({ org_id: orgId })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: actorId,
    action: "update_org",
    resource_type: "user",
    resource_id: userId,
    details: { new_org_id: orgId },
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/god");
  return { success: true };
}

export async function toggleUserActive(
  userId: string,
  isActive: boolean,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: actorId,
    action: isActive ? "activate_user" : "deactivate_user",
    resource_type: "user",
    resource_id: userId,
    details: {},
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/god");
  return { success: true };
}

export async function deleteUser(
  userId: string,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient();

  // Delete credentials first
  await supabase.from("credentials").delete().eq("user_id", userId);

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) return { success: false, error: error.message };

  await supabase.from("audit_logs").insert({
    user_id: actorId,
    action: "delete_user",
    resource_type: "user",
    resource_id: userId,
    details: {},
  });

  // Remove user from Permit.io
  await removeUserFromPermit(userId);

  revalidatePath("/dashboard/users");
  revalidatePath("/god");
  return { success: true };
}

/* ═══════════════════════════════════════════════════════════════
   Audit Logs
   ═══════════════════════════════════════════════════════════════ */

export async function getAuditLogs(orgId?: string, limit = 100) {
  const supabase = createServerClient();
  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (orgId) {
    query = query.eq("org_id", orgId);
  }

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

/* ═══════════════════════════════════════════════════════════════
   Org Stats (for dashboards)
   ═══════════════════════════════════════════════════════════════ */

export async function getOrgStats(orgId: string) {
  const supabase = createServerClient();

  const [users, docs, agents] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact" }).eq("org_id", orgId),
    supabase.from("documents").select("id", { count: "exact" }).eq("org_id", orgId),
    supabase.from("ai_agents").select("id", { count: "exact" }).eq("org_id", orgId),
  ]);

  return {
    userCount: users.count || 0,
    documentCount: docs.count || 0,
    agentCount: agents.count || 0,
  };
}

export async function getGlobalStats() {
  const supabase = createServerClient();

  const [orgs, users, docs, agents] = await Promise.all([
    supabase.from("organizations").select("id", { count: "exact" }),
    supabase.from("profiles").select("id", { count: "exact" }),
    supabase.from("documents").select("id", { count: "exact" }),
    supabase.from("ai_agents").select("id", { count: "exact" }),
  ]);

  return {
    orgCount: orgs.count || 0,
    userCount: users.count || 0,
    documentCount: docs.count || 0,
    agentCount: agents.count || 0,
  };
}
