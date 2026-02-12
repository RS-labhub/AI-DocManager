import { v4 as uuidv4 } from "uuid"
import { type AIAgent, type AIAction, type AIActionStatus, AIPermissionLevel } from "./ai-auth-types"

// Initialize localStorage for AI agents and actions
const initializeAIStorage = () => {
  if (typeof window === "undefined") return

  // Initialize AI agents if not exists
  if (!localStorage.getItem("ai_agents")) {
    const defaultAgents: AIAgent[] = [
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
    localStorage.setItem("ai_agents", JSON.stringify(defaultAgents))
  }

  // Initialize AI actions if not exists
  if (!localStorage.getItem("ai_actions")) {
    const defaultActions: AIAction[] = [
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
    localStorage.setItem("ai_actions", JSON.stringify(defaultActions))
  }

  // Initialize AI permission settings if not exists
  if (!localStorage.getItem("ai_permission_settings")) {
    const defaultPermissionSettings = [
      {
        id: "1",
        resourceType: "document",
        permissionLevel: AIPermissionLevel.READ_ONLY,
        requiresApproval: false,
        approverRoles: ["admin", "editor"],
      },
      {
        id: "2",
        resourceType: "document",
        resourceId: "1",
        resourceName: "Getting Started Guide",
        permissionLevel: AIPermissionLevel.SUGGEST_ONLY,
        requiresApproval: true,
        approverRoles: ["admin"],
      },
      {
        id: "3",
        resourceType: "document",
        resourceId: "2",
        resourceName: "Security Policy",
        permissionLevel: AIPermissionLevel.FULL_ACCESS,
        requiresApproval: false,
        approverRoles: ["admin"],
      },
    ]
    localStorage.setItem("ai_permission_settings", JSON.stringify(defaultPermissionSettings))
  }
}

// Get all AI agents
export const getAIAgents = (): AIAgent[] => {
  if (typeof window === "undefined") return []

  initializeAIStorage()
  const agents = localStorage.getItem("ai_agents")
  return agents ? JSON.parse(agents) : []
}

// Get a specific AI agent
export const getAIAgent = (id: string): AIAgent | undefined => {
  const agents = getAIAgents()
  return agents.find((agent) => agent.id === id)
}

// Update an AI agent
export const updateAIAIAgent = (agent: AIAgent): AIAgent => {
  const agents = getAIAgents()
  const index = agents.findIndex((a) => a.id === agent.id)

  if (index !== -1) {
    agents[index] = {
      ...agent,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem("ai_agents", JSON.stringify(agents))
    return agents[index]
  }

  throw new Error("Agent not found")
}

// Create a new AI agent
export const createAIAgent = (agent: Omit<AIAgent, "id" | "createdAt" | "updatedAt">): AIAgent => {
  const agents = getAIAgents()
  const now = new Date().toISOString()

  const newAgent: AIAgent = {
    ...agent,
    id: `ai-${agent.role}-${uuidv4().substring(0, 8)}`,
    createdAt: now,
    updatedAt: now,
  }

  agents.push(newAgent)
  localStorage.setItem("ai_agents", JSON.stringify(agents))
  return newAgent
}

// Delete an AI agent
export const deleteAIAIAgent = (id: string): boolean => {
  const agents = getAIAgents()
  const filteredAgents = agents.filter((agent) => agent.id !== id)

  if (filteredAgents.length < agents.length) {
    localStorage.setItem("ai_agents", JSON.stringify(filteredAgents))
    return true
  }

  return false
}

// Get all AI actions
export const getAIActions = (): AIAction[] => {
  if (typeof window === "undefined") return []

  initializeAIStorage()
  const actions = localStorage.getItem("ai_actions")
  return actions ? JSON.parse(actions) : []
}

// Get pending AI actions
export const getPendingAIActions = (): AIAction[] => {
  const actions = getAIActions()
  return actions.filter((action) => action.status === "pending")
}

// Get AI actions for a specific document
export const getAIActionsForDocument = (documentId: string): AIAction[] => {
  const actions = getAIActions()
  return actions.filter((action) => action.resourceId === documentId)
}

// Get AI actions for a specific agent
export const getAIActionsForAgent = (agentId: string): AIAction[] => {
  const actions = getAIActions()
  return actions.filter((action) => action.agentId === agentId)
}

// Create an AI action
export const createAIAction = (
  agentId: string,
  actionType: string,
  resourceType: string,
  resourceId: string,
  metadata: Record<string, any>,
  status: AIActionStatus = "pending",
): AIAction => {
  const actions = getAIActions()

  const newAction: AIAction = {
    id: `action-${uuidv4().substring(0, 8)}`,
    agentId,
    actionType,
    resourceType,
    resourceId,
    status,
    requestedAt: new Date().toISOString(),
    requestedBy: agentId,
    metadata,
  }

  if (status === "completed") {
    newAction.completedAt = new Date().toISOString()
  }

  actions.push(newAction)
  localStorage.setItem("ai_actions", JSON.stringify(actions))
  return newAction
}

// Update an AI action
export const updateAIAction = (
  actionId: string,
  status: AIActionStatus,
  userId?: string,
  result?: any,
): AIAction | null => {
  const actions = getAIActions()
  const actionIndex = actions.findIndex((action) => action.id === actionId)

  if (actionIndex === -1) return null

  const updatedAction = { ...actions[actionIndex], status }

  if (status === "approved" && userId) {
    updatedAction.approvedBy = userId
  } else if (status === "rejected" && userId) {
    updatedAction.rejectedBy = userId
  } else if (status === "completed") {
    updatedAction.completedAt = new Date().toISOString()
    if (result) updatedAction.result = result
  }

  actions[actionIndex] = updatedAction
  localStorage.setItem("ai_actions", JSON.stringify(actions))
  return updatedAction
}

// Get permission settings
export const getAIPermissionSettings = () => {
  if (typeof window === "undefined") return []

  initializeAIStorage()
  const settings = localStorage.getItem("ai_permission_settings")
  return settings ? JSON.parse(settings) : []
}

// Update permission settings
export const updateAIPermissionSettings = (settings: any[]) => {
  localStorage.setItem("ai_permission_settings", JSON.stringify(settings))
  return settings
}

// Check if an AI agent has permission for an action
export const checkAIPermission = (
  agentId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
): {
  permitted: boolean
  requiresApproval: boolean
  permissionLevel: AIPermissionLevel
} => {
  // Find the AI agent
  const agent = getAIAgent(agentId)
  if (!agent || !agent.isActive) {
    return {
      permitted: false,
      requiresApproval: true,
      permissionLevel: AIPermissionLevel.NO_ACCESS,
    }
  }

  // Get permission settings
  const permissionSettings = getAIPermissionSettings()

  // Find the most specific permission setting
  let permissionSetting = permissionSettings.find(
    (setting) => setting.resourceType === resourceType && setting.resourceId === resourceId,
  )

  // If no specific setting found, look for a general one
  if (!permissionSetting) {
    permissionSetting = permissionSettings.find(
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
      case "analyze_document":
        return cap === "analyze_content"
      case "summarize_document":
        return cap === "summarize_content"
      case "translate_document":
        return cap === "translate_content"
      case "improve_document":
        return cap === "edit_documents" || cap === "suggest_edits" || cap === "generate_content"
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
      permitted = action === "read" || action === "analyze_document" || action === "summarize_document"
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
    (action === "create" || action === "update" || action === "delete" || action === "improve_document")
  ) {
    requiresApproval = true
  }

  // Read-only never requires approval for read operations
  if (
    permissionSetting.permissionLevel === AIPermissionLevel.READ_ONLY &&
    (action === "read" || action === "analyze_document" || action === "summarize_document")
  ) {
    requiresApproval = false
  }

  return {
    permitted,
    requiresApproval,
    permissionLevel: permissionSetting.permissionLevel,
  }
}

// Generate AI content based on action type using Groq API
export const generateAIContent = async (
  actionType: string,
  documentTitle: string,
  documentContent: string,
): Promise<{ result: string; changes?: { title: string; content: string } }> => {
  try {
    // Map action types to API actions
    const apiAction =
      actionType === "summarize_document"
        ? "summarize"
        : actionType === "analyze_document"
          ? "analyze"
          : actionType === "improve_document"
            ? "improve"
            : null

    if (!apiAction) {
      return {
        result: `Unknown action type: ${actionType}`,
      }
    }

    console.log(`Calling AI API with action: ${apiAction}`)

    // Check if GROQ_API_KEY is available
    if (!process.env.GROQ_API_KEY) {
      console.warn("GROQ_API_KEY is not set, using fallback content generation")
      return generateFallbackAIContent(apiAction, documentTitle, documentContent)
    }

    try {
      // Add a timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      // Call the API route with proper error handling
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: apiAction,
          title: documentTitle,
          content: documentContent,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      console.log("API response status:", response.status)

      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to get error details if available
        let errorMessage = `API request failed with status ${response.status}`

        try {
          // Get the response as text first
          const responseText = await response.text()
          console.log("Error response text:", responseText ? responseText.substring(0, 200) : "Empty response")

          // Check if it's HTML (error page)
          if (
            responseText &&
            (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html"))
          ) {
            throw new Error("Received HTML error page instead of JSON response")
          }

          // Try to parse as JSON if possible
          if (responseText && responseText.trim().startsWith("{")) {
            const errorData = JSON.parse(responseText)
            if (errorData.error) {
              errorMessage = errorData.error
            }
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
        }

        throw new Error(errorMessage)
      }

      // Now that we know the response is ok, try to parse the JSON
      const responseText = await response.text()
      if (!responseText || responseText.trim() === "") {
        throw new Error("Empty response from API")
      }

      let data
      try {
        data = await JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse API response as JSON:", parseError)
        console.error("Raw response:", responseText.substring(0, 200))
        throw new Error(`Failed to parse API response: ${parseError.message}`)
      }

      // Handle the response based on action type
      if (actionType === "improve_document" && data.result?.title && data.result?.content) {
        return {
          result: "Document improvement suggestions generated",
          changes: {
            title: data.result.title,
            content: data.result.content,
          },
        }
      }

      return {
        result: data.result || "No result returned from API",
      }
    } catch (apiError) {
      console.error(`Error calling AI API:`, apiError)

      // If it's an abort error (timeout), provide a specific message
      if (apiError.name === "AbortError") {
        throw new Error("API request timed out. The server may be busy or the document is too large.")
      }

      // For other errors, use fallback content generation
      console.log("Using fallback content generation due to API error")
      return generateFallbackAIContent(apiAction, documentTitle, documentContent)
    }
  } catch (error) {
    console.error(`Error generating AI content:`, error)

    // If we've already tried fallback, don't try again to avoid infinite recursion
    if (error.message && error.message.includes("Fallback content")) {
      throw error
    }

    // Try fallback content generation for any error
    try {
      console.log("Using fallback content generation due to error")
      return generateFallbackAIContent("fallback", documentTitle, documentContent)
    } catch (fallbackError) {
      throw new Error(`Error generating AI content: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

// Fallback content generation when API is not available
function generateFallbackAIContent(
  action: string,
  title: string,
  content: string,
): { result: string; changes?: { title: string; content: string } } {
  console.log(`Generating fallback content for action: ${action}`)

  // Truncate content if it's too long
  const truncatedContent = content.length > 100 ? content.substring(0, 100) + "..." : content

  // Generate different responses based on action type
  switch (action) {
    case "summarize":
      return {
        result:
          `Fallback content: Summary of "${title}"\n\n` +
          `This is a mock summary generated because the AI API is not available.\n\n` +
          `The document appears to be about ${title.toLowerCase()} and contains approximately ${content.length} characters.\n\n` +
          `For a real summary, please ensure the Groq API key is properly configured.`,
      }

    case "analyze":
      return {
        result:
          `Fallback content: Analysis of "${title}"\n\n` +
          `Document Type: ${title.includes("Report") ? "Report" : title.includes("Policy") ? "Policy" : "General Document"}\n\n` +
          `Key Topics: ${title}\n\n` +
          `Structure: The document contains approximately ${content.length} characters.\n\n` +
          `This is a mock analysis generated because the AI API is not available.\n` +
          `For a real analysis, please ensure the Groq API key is properly configured.`,
      }

    case "improve":
      // For improvement, we need to return both result and changes
      const improvedTitle = `Improved: ${title}`
      const improvedContent = `${content}\n\n[This is mock improved content generated because the AI API is not available. In a real scenario, this would contain AI-suggested improvements to your document.]`

      return {
        result: "Fallback content: Document improvement suggestions generated",
        changes: {
          title: improvedTitle,
          content: improvedContent,
        },
      }

    default:
      return {
        result:
          `Fallback content: The AI service is currently unavailable.\n\n` +
          `This is a mock response for your document "${title}".\n\n` +
          `To use AI features, please ensure the Groq API key is properly configured.`,
      }
  }
}
