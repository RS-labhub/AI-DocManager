// Types for AI authorization

export type AIAgentRole = "assistant" | "analyzer" | "editor" | "admin"

export interface AIAgent {
  id: string
  name: string
  description: string
  role: AIAgentRole
  capabilities: AICapability[]
  createdBy: string // User ID who created this agent
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export type AICapability =
  | "read_documents"
  | "suggest_edits"
  | "create_documents"
  | "edit_documents"
  | "delete_documents"
  | "analyze_content"
  | "summarize_content"
  | "translate_content"
  | "generate_content"

export type AIActionStatus = "pending" | "approved" | "rejected" | "completed" | "failed"

export interface AIAction {
  id: string
  agentId: string
  actionType: string
  resourceType: string
  resourceId: string
  status: AIActionStatus
  requestedAt: string
  completedAt?: string
  requestedBy: string // AI agent ID
  approvedBy?: string // User ID who approved
  rejectedBy?: string // User ID who rejected
  metadata: Record<string, any>
  result?: any
}

// AI permission levels
export enum AIPermissionLevel {
  NO_ACCESS = "no_access",
  READ_ONLY = "read_only",
  SUGGEST_ONLY = "suggest_only", // Can suggest changes but needs approval
  FULL_ACCESS = "full_access", // Can make changes without approval
}

// AI permission settings for a resource
export interface AIPermissionSetting {
  id: string
  resourceType: string
  resourceId?: string // If undefined, applies to all resources of this type
  resourceName?: string // Optional name for the resource
  permissionLevel: AIPermissionLevel
  requiresApproval: boolean
  approverRoles: string[] // User roles that can approve actions
}
