/* ─────────────────────────────────────────────────────────────
   Role-Based Access Control — 4-tier hierarchy
   god > super_admin > admin > user
   ───────────────────────────────────────────────────────────── */

import type { UserRole } from "@/lib/supabase/types";

/** Numeric weight for role comparison (higher = more powerful) */
const ROLE_WEIGHT: Record<UserRole, number> = {
  god: 100,
  super_admin: 75,
  admin: 50,
  user: 10,
};

/** Check if roleA outranks roleB */
export function outranks(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_WEIGHT[roleA] > ROLE_WEIGHT[roleB];
}

/** Check if roleA is at least as powerful as roleB */
export function isAtLeast(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_WEIGHT[roleA] >= ROLE_WEIGHT[roleB];
}

/* ─── Permission Definitions ────────────────────────────────── */

export const RESOURCES = {
  DOCUMENT: "document",
  ORGANIZATION: "organization",
  USER: "user",
  AI_AGENT: "ai_agent",
  AI_ACTION: "ai_action",
  AI_KEY: "ai_key",
  ADMIN_PANEL: "admin_panel",
  GOD_PANEL: "god_panel",
  AUDIT_LOG: "audit_log",
  SYSTEM_SETTINGS: "system_settings",
} as const;

export const ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  ACCESS: "access",
  APPROVE: "approve",
  REJECT: "reject",
  MANAGE: "manage",
  PROMOTE: "promote",
  DEMOTE: "demote",
} as const;

type Resource = (typeof RESOURCES)[keyof typeof RESOURCES];
type Action = (typeof ACTIONS)[keyof typeof ACTIONS];

interface PermissionContext {
  ownerId?: string;       // resource owner
  userId?: string;        // requesting user
  orgId?: string;         // resource org
  userOrgId?: string;     // requesting user's org
}

/**
 * Check if a user role has permission for an action on a resource.
 * Takes into account ownership and org boundaries.
 */
export function hasPermission(
  role: UserRole,
  action: Action,
  resource: Resource,
  ctx: PermissionContext = {}
): boolean {
  // God can do everything
  if (role === "god") return true;

  // God panel is only for god
  if (resource === RESOURCES.GOD_PANEL) return false;

  // ─── Organization scoping ───────────────────────────────
  // Non-god users can only access resources within their org
  if (ctx.orgId && ctx.userOrgId && ctx.orgId !== ctx.userOrgId) {
    return false;
  }

  // ─── Admin panel access ────────────────────────────────
  if (resource === RESOURCES.ADMIN_PANEL) {
    return isAtLeast(role, "admin");
  }

  // ─── System settings ───────────────────────────────────
  if (resource === RESOURCES.SYSTEM_SETTINGS) {
    return isAtLeast(role, "super_admin");
  }

  // ─── Audit logs ─────────────────────────────────────────
  if (resource === RESOURCES.AUDIT_LOG) {
    return isAtLeast(role, "admin");
  }

  // ─── Organization management ───────────────────────────
  if (resource === RESOURCES.ORGANIZATION) {
    if (action === ACTIONS.READ) return isAtLeast(role, "admin");
    return isAtLeast(role, "super_admin");
  }

  // ─── User management ──────────────────────────────────
  if (resource === RESOURCES.USER) {
    if (action === ACTIONS.READ) return isAtLeast(role, "admin");
    if (action === ACTIONS.CREATE || action === ACTIONS.DELETE) return isAtLeast(role, "admin");
    if (action === ACTIONS.UPDATE) {
      // Users can update themselves
      if (ctx.userId && ctx.ownerId && ctx.userId === ctx.ownerId) return true;
      return isAtLeast(role, "admin");
    }
    if (action === ACTIONS.PROMOTE || action === ACTIONS.DEMOTE) {
      return isAtLeast(role, "super_admin");
    }
    return false;
  }

  // ─── Document management ──────────────────────────────
  if (resource === RESOURCES.DOCUMENT) {
    if (action === ACTIONS.READ) return true; // visible if same org (checked above)
    if (action === ACTIONS.CREATE) return true; // any user can create
    if (action === ACTIONS.UPDATE) {
      if (ctx.userId && ctx.ownerId && ctx.userId === ctx.ownerId) return true;
      return isAtLeast(role, "admin");
    }
    if (action === ACTIONS.DELETE) {
      if (ctx.userId && ctx.ownerId && ctx.userId === ctx.ownerId) return true;
      return isAtLeast(role, "admin");
    }
    return false;
  }

  // ─── AI Agent management ──────────────────────────────
  if (resource === RESOURCES.AI_AGENT) {
    if (action === ACTIONS.READ) return true;
    return isAtLeast(role, "admin");
  }

  // ─── AI Action approval ───────────────────────────────
  if (resource === RESOURCES.AI_ACTION) {
    if (action === ACTIONS.READ) return true;
    if (action === ACTIONS.APPROVE || action === ACTIONS.REJECT) {
      return isAtLeast(role, "admin");
    }
    return isAtLeast(role, "admin");
  }

  // ─── AI API Keys ─────────────────────────────────────
  if (resource === RESOURCES.AI_KEY) {
    // Users can manage their own keys
    if (ctx.userId && ctx.ownerId && ctx.userId === ctx.ownerId) return true;
    return isAtLeast(role, "super_admin");
  }

  return false;
}

/** Label & color for role badges */
export function getRoleInfo(role: UserRole) {
  const map: Record<UserRole, { label: string; color: string; bgClass: string }> = {
    god:         { label: "God",         color: "text-red-500",     bgClass: "bg-red-100 text-red-700 border border-red-200 hover:bg-red-200 hover:text-red-800 dark:bg-red-950 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900 dark:hover:text-red-200 transition-colors" },
    super_admin: { label: "Super Admin", color: "text-amber-500",   bgClass: "bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 hover:text-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900 dark:hover:text-amber-200 transition-colors" },
    admin:       { label: "Admin",       color: "text-blue-500",    bgClass: "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 hover:text-blue-800 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900 dark:hover:text-blue-200 transition-colors" },
    user:        { label: "User",        color: "text-stone-500",   bgClass: "bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 hover:text-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-700 dark:hover:text-stone-200 transition-colors" },
  };
  return map[role];
}
