/* ═══════════════════════════════════════════════════════════════
   Permit.io Integration — Fine-Grained Access Control
   ═══════════════════════════════════════════════════════════════
   Uses Permit.io SDK alongside our local RBAC for policy-based
   authorization decisions. The SDK calls the Permit.io PDP (Policy
   Decision Point) which evaluates the configured RBAC/ABAC policies.

   Resources:
     • document   — CRUD + ai_action
     • user       — read, create, update, delete, change_role
     • organization — read, create, update, delete
     • ai_key     — read, create, delete
     • audit_log  — read

   Roles (synced to Permit.io dashboard):
     • god          — full system access
     • super_admin  — full org access + cross-org read
     • admin        — org-level management
     • user         — basic document access
   ═══════════════════════════════════════════════════════════════ */

import { Permit } from "permitio";
import type { UserRole } from "./supabase/types";

/* ─── Permit Client ─────────────────────────────────────────── */

const permit = new Permit({
  pdp: process.env.PERMIT_PDP_URL || "https://cloudpdp.api.permit.io",
  token: process.env.PERMIT_SDK_TOKEN || "",
});

/* ─── Resource + Action Definitions ─────────────────────────── */

export type PermitResource =
  | "document"
  | "user"
  | "organization"
  | "ai_key"
  | "audit_log"
  | "ai_agent";

export type PermitAction =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "ai_action"
  | "change_role"
  | "manage";

/* ─── Core Check Function ───────────────────────────────────── */

/**
 * Check if a user is permitted to perform an action on a resource
 * via the Permit.io PDP. Falls back to local RBAC if PDP is unavailable.
 */
export async function checkPermission(
  userId: string,
  action: PermitAction,
  resource: PermitResource,
  context?: Record<string, unknown>
): Promise<boolean> {
  try {
    // If no token configured, fall back to local permissions
    if (!process.env.PERMIT_SDK_TOKEN) {
      console.warn("[Permit] No SDK token configured — using local RBAC only");
      return true; // Caller should use local RBAC from lib/permissions.ts
    }

    const permitted = await permit.check(
      userId,
      action,
      { type: resource, ...(context || {}) }
    );

    return permitted;
  } catch (error) {
    console.error("[Permit] Permission check failed, falling back:", error);
    // Fail-open to local RBAC in case PDP is unreachable
    return true;
  }
}

/**
 * Bulk check — check multiple permissions at once.
 * Returns a map of "action:resource" → boolean.
 */
export async function checkPermissions(
  userId: string,
  checks: Array<{ action: PermitAction; resource: PermitResource }>
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  await Promise.all(
    checks.map(async ({ action, resource }) => {
      const key = `${action}:${resource}`;
      results[key] = await checkPermission(userId, action, resource);
    })
  );

  return results;
}

/* ─── User Sync ─────────────────────────────────────────────── */

/**
 * Sync a user to Permit.io when they register or their role changes.
 * This ensures the PDP knows about the user and their role assignment.
 */
export async function syncUserToPermit(
  userId: string,
  email: string,
  role: UserRole,
  orgId?: string | null
): Promise<void> {
  try {
    if (!process.env.PERMIT_SDK_TOKEN) return;

    // Sync user to Permit
    await permit.api.syncUser({
      key: userId,
      email,
      attributes: {
        role,
        org_id: orgId || null,
      },
    });

    // Assign role in Permit (tenant = org or "global")
    const tenant = orgId || "global";
    await permit.api.assignRole({
      user: userId,
      role: role,
      tenant: tenant,
    });

    console.log(`[Permit] Synced user ${email} as ${role} in tenant ${tenant}`);
  } catch (error) {
    console.error("[Permit] Failed to sync user:", error);
    // Non-fatal — local RBAC still works
  }
}

/**
 * Remove a user from Permit.io when they are deleted.
 */
export async function removeUserFromPermit(userId: string): Promise<void> {
  try {
    if (!process.env.PERMIT_SDK_TOKEN) return;
    await permit.api.deleteUser(userId);
    console.log(`[Permit] Removed user ${userId}`);
  } catch (error) {
    console.error("[Permit] Failed to remove user:", error);
  }
}

/* ─── Role Management ───────────────────────────────────────── */

/**
 * Update a user's role in Permit.io when it changes.
 */
export async function updateUserRoleInPermit(
  userId: string,
  oldRole: UserRole,
  newRole: UserRole,
  orgId?: string | null
): Promise<void> {
  try {
    if (!process.env.PERMIT_SDK_TOKEN) return;

    const tenant = orgId || "global";

    // Unassign old role
    try {
      await permit.api.unassignRole({
        user: userId,
        role: oldRole,
        tenant: tenant,
      });
    } catch {
      // May not exist — ignore
    }

    // Assign new role
    await permit.api.assignRole({
      user: userId,
      role: newRole,
      tenant: tenant,
    });

    console.log(`[Permit] Updated user ${userId} role: ${oldRole} → ${newRole}`);
  } catch (error) {
    console.error("[Permit] Failed to update role:", error);
  }
}

/* ─── Resource-Level Checks (Convenience Wrappers) ──────────── */

export async function canReadDocument(userId: string): Promise<boolean> {
  return checkPermission(userId, "read", "document");
}

export async function canCreateDocument(userId: string): Promise<boolean> {
  return checkPermission(userId, "create", "document");
}

export async function canUpdateDocument(userId: string): Promise<boolean> {
  return checkPermission(userId, "update", "document");
}

export async function canDeleteDocument(userId: string): Promise<boolean> {
  return checkPermission(userId, "delete", "document");
}

export async function canPerformAiAction(userId: string): Promise<boolean> {
  return checkPermission(userId, "ai_action", "document");
}

export async function canManageUsers(userId: string): Promise<boolean> {
  return checkPermission(userId, "manage", "user");
}

export async function canManageOrganization(userId: string): Promise<boolean> {
  return checkPermission(userId, "manage", "organization");
}

export async function canViewAuditLogs(userId: string): Promise<boolean> {
  return checkPermission(userId, "read", "audit_log");
}

/* ─── Export the raw client for advanced usage ──────────────── */

export { permit };
