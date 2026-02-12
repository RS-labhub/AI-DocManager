import { Permit } from "permitio"
import { type AIAgent, AIPermissionLevel, type AIAction, type AIActionStatus } from "./ai-auth-types"

// Initialize Permit SDK with proper configuration
let permit: Permit | null = null

// Initialize the SDK lazily to avoid issues during server-side rendering
function getPermitInstance() {
  if (!permit) {
    try {
      // Check if we're in a browser environment
      if (typeof window !== "undefined") {
        permit = new Permit({
          // Use environment variables
          pdp: process.env.PERMIT_PDP_URL,
          token: process.env.PERMIT_SDK_TOKEN,
          // Add debug mode to see more information
          debug: true,
          // Disable logger to avoid Winston constructor issues
          logger: null,
        })
        console.log("Permit SDK initialized successfully")
      } else {
        console.log("Skipping Permit SDK initialization in server environment")
        return null
      }
    } catch (error) {
      console.error("Failed to initialize Permit SDK:", error)
    }
  }
  return permit
}

// Resource types
export const RESOURCES = {
  DOCUMENT: "document",
  ADMIN_PANEL: "admin_panel",
  AI_AGENT: "ai_agent",
  AI_ACTION: "ai_action",
}

// Actions
export const ACTIONS = {
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",
  ACCESS: "access",
  APPROVE: "approve",
  REJECT: "reject",
  EXECUTE: "execute",
}

// Check if a user can perform an action on a resource
export async function checkPermission(
  userId: string,
  action: string,
  resourceType: string,
  resourceAttributes: Record<string, any> = {},
): Promise<boolean> {
  try {
    // Get the SDK instance
    const permitInstance = getPermitInstance()

    // Ensure the SDK is properly initialized
    if (!permitInstance) {
      console.warn("Permit SDK not initialized, allowing access by default")
      return true // For development, allow access if SDK is not initialized
    }

    // Format the resource properly for the check
    const resource = {
      type: resourceType,
      // Include all attributes
      attributes: resourceAttributes,
    }

    // Log the check attempt for debugging
    console.log(`Checking permission: user=${userId}, action=${action}, resource=${JSON.stringify(resource)}`)

    // Use a try-catch to handle potential errors
    const permitted = await permitInstance.check(userId, action, resource)

    // Log the result
    console.log(`Permission check result: ${permitted}`)

    return permitted
  } catch (error) {
    console.error(`Permission check failed: ${error instanceof Error ? error.message : String(error)}`)

    // For development purposes, we'll allow access if there's an error
    // In production, you might want to deny access instead
    return true
  }
}

// For client-side permission checks (simplified)
export function hasPermission(
  userRole: string,
  action: string,
  resourceType: string,
  resourceAttributes: Record<string, any> = {},
): boolean {
  // This is a simplified client-side permission check
  // In a real application, you would use the Permit.io SDK

  // Admin can do everything
  if (userRole === "admin") return true

  // Document permissions
  if (resourceType === RESOURCES.DOCUMENT) {
    // Document owner can do everything with their own document
    if (resourceAttributes.userId && resourceAttributes.ownerId === resourceAttributes.userId) return true

    // Editor permissions
    if (userRole === "editor") {
      return action === ACTIONS.CREATE || action === ACTIONS.READ || action === ACTIONS.UPDATE
    }

    // Viewer permissions
    if (userRole === "viewer") {
      return action === ACTIONS.READ
    }
  }

  // Admin panel access
  if (resourceType === RESOURCES.ADMIN_PANEL) {
    return userRole === "admin"
  }

  // AI Agent management
  if (resourceType === RESOURCES.AI_AGENT) {
    // Only admins can manage AI agents
    return userRole === "admin"
  }

  // AI Action approval
  if (resourceType === RESOURCES.AI_ACTION) {
    // Admins can approve/reject any AI action
    if (action === ACTIONS.APPROVE || action === ACTIONS.REJECT) {
      return userRole === "admin" || userRole === "editor"
    }
  }

  return false
}

// Mock AI agents for demo purposes
const aiAgents: AIAgent[] = [
  {
    id: "ai-assistant-1",
    name: "Document Assistant",
    description: "Helps with document organization and basic tasks",
    role: "assistant",
    capabilities: ["read_documents", "suggest_edits", "summarize_content"],
    createdBy: "admin-id",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: "ai-editor-1",
    name: "Content Editor",
    description: "AI that can edit and improve document content",
    role: "editor",
    capabilities: ["read_documents", "edit_documents", "generate_content"],
    createdBy: "admin-id",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: "ai-analyzer-1",
    name: "Document Analyzer",
    description: "Analyzes document content and provides insights",
    role: "analyzer",
    capabilities: ["read_documents", "analyze_content", "summarize_content"],
    createdBy: "admin-id",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
]

// Mock AI actions for demo purposes
const aiActions: AIAction[] = [
  {
    id: "action-1",
    agentId: "ai-editor-1",
    actionType: "edit_document",
    resourceType: "document",
    resourceId: "1",
    status: "pending",
    requestedAt: new Date().toISOString(),
    requestedBy: "ai-editor-1",
    metadata: {
      changes: {
        title: "Updated Getting Started Guide",
        content: "This is an AI-suggested improvement to the getting started guide.",
      },
      reason: "Improving clarity and readability",
    },
  },
  {
    id: "action-2",
    agentId: "ai-assistant-1",
    actionType: "summarize_document",
    resourceType: "document",
    resourceId: "2",
    status: "completed",
    requestedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    completedAt: new Date(Date.now() - 86000000).toISOString(),
    requestedBy: "ai-assistant-1",
    approvedBy: "admin-id",
    metadata: {
      reason: "User requested summary",
    },
    result:
      "This document outlines the security policies including access control, data protection, and compliance requirements.",
  },
  {
    id: "action-3",
    agentId: "ai-analyzer-1",
    actionType: "analyze_document",
    resourceType: "document",
    resourceId: "3",
    status: "rejected",
    requestedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    requestedBy: "ai-analyzer-1",
    rejectedBy: "user-id",
    metadata: {
      reason: "Automated content analysis",
      analysisType: "sentiment and key topics",
    },
  },
]

// Mock permission settings for AI agents
const aiPermissionSettings = [
  {
    resourceType: "document",
    permissionLevel: AIPermissionLevel.READ_ONLY,
    requiresApproval: false,
    approverRoles: ["admin", "editor"],
  },
  {
    resourceType: "document",
    resourceId: "1",
    permissionLevel: AIPermissionLevel.SUGGEST_ONLY,
    requiresApproval: true,
    approverRoles: ["admin"],
  },
  {
    resourceType: "document",
    resourceId: "2",
    permissionLevel: AIPermissionLevel.FULL_ACCESS,
    requiresApproval: false,
    approverRoles: ["admin"],
  },
]

// Get all AI agents
export function getAIAgents(): AIAgent[] {
  return [...aiAgents]
}

// Get a specific AI agent
export function getAIAgent(id: string): AIAgent | undefined {
  return aiAgents.find((agent) => agent.id === id)
}

// Get all AI actions
export function getAIActions(): AIAction[] {
  return [...aiActions]
}

// Get pending AI actions
export function getPendingAIActions(): AIAction[] {
  return aiActions.filter((action) => action.status === "pending")
}

// Get AI actions for a specific document
export function getAIActionsForDocument(documentId: string): AIAction[] {
  return aiActions.filter((action) => action.resourceId === documentId)
}

// Check if an AI agent has permission for an action
export function checkAIPermission(
  agentId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
): {
  permitted: boolean
  requiresApproval: boolean
  permissionLevel: AIPermissionLevel
} {
  // Find the AI agent
  const agent = getAIAgent(agentId)
  if (!agent || !agent.isActive) {
    return {
      permitted: false,
      requiresApproval: true,
      permissionLevel: AIPermissionLevel.NO_ACCESS,
    }
  }

  // Find the most specific permission setting
  let permissionSetting = aiPermissionSettings.find(
    (setting) => setting.resourceType === resourceType && setting.resourceId === resourceId,
  )

  // If no specific setting found, look for a general one
  if (!permissionSetting) {
    permissionSetting = aiPermissionSettings.find(
      (setting) => setting.resourceType === resourceType && !setting.resourceId,
    )
  }

  // Default to no access if no setting found
  if (!permissionSetting) {
    return {
      permitted: false,
      requiresApproval: true,
      permissionLevel: AIPermissionLevel.NO_ACCESS,
    }
  }

  // Check if the agent has the required capability
  const hasCapability = agent.capabilities.some((cap) => {
    switch (action) {
      case "read":
        return cap === "read_documents"
      case "create":
        return cap === "create_documents"
      case "update":
        return cap === "edit_documents" || cap === "suggest_edits"
      case "delete":
        return cap === "delete_documents"
      case "analyze":
        return cap === "analyze_content"
      case "summarize":
        return cap === "summarize_content"
      case "translate":
        return cap === "translate_content"
      case "generate":
        return cap === "generate_content"
      default:
        return false
    }
  })

  if (!hasCapability) {
    return {
      permitted: false,
      requiresApproval: true,
      permissionLevel: AIPermissionLevel.NO_ACCESS,
    }
  }

  // Check permission level
  let permitted = false
  switch (permissionSetting.permissionLevel) {
    case AIPermissionLevel.NO_ACCESS:
      permitted = false
      break
    case AIPermissionLevel.READ_ONLY:
      permitted = action === "read" || action === "analyze" || action === "summarize"
      break
    case AIPermissionLevel.SUGGEST_ONLY:
      permitted = true // Can suggest any action, but will require approval
      break
    case AIPermissionLevel.FULL_ACCESS:
      permitted = true
      break
  }

  // Determine if approval is required
  let requiresApproval = permissionSetting.requiresApproval

  // Suggest-only always requires approval for write operations
  if (
    permissionSetting.permissionLevel === AIPermissionLevel.SUGGEST_ONLY &&
    (action === "create" || action === "update" || action === "delete")
  ) {
    requiresApproval = true
  }

  // Read-only never requires approval for read operations
  if (
    permissionSetting.permissionLevel === AIPermissionLevel.READ_ONLY &&
    (action === "read" || action === "analyze" || action === "summarize")
  ) {
    requiresApproval = false
  }

  return {
    permitted,
    requiresApproval,
    permissionLevel: permissionSetting.permissionLevel,
  }
}

// Create an AI action request
export function createAIActionRequest(
  agentId: string,
  actionType: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, any>,
): AIAction {
  const newAction: AIAction = {
    id: `action-${Date.now()}`,
    agentId,
    actionType,
    resourceType,
    resourceId,
    status: "pending",
    requestedAt: new Date().toISOString(),
    requestedBy: agentId,
    metadata,
  }

  // Add to actions array
  aiActions.push(newAction)

  return newAction
}

// Update an AI action status
export function updateAIActionStatus(
  actionId: string,
  status: AIActionStatus,
  userId?: string,
  result?: any,
): AIAction | null {
  const actionIndex = aiActions.findIndex((action) => action.id === actionId)
  if (actionIndex === -1) return null

  const updatedAction = { ...aiActions[actionIndex], status }

  if (status === "approved" && userId) {
    updatedAction.approvedBy = userId
  } else if (status === "rejected" && userId) {
    updatedAction.rejectedBy = userId
  } else if (status === "completed") {
    updatedAction.completedAt = new Date().toISOString()
    if (result) updatedAction.result = result
  }

  aiActions[actionIndex] = updatedAction
  return updatedAction
}
