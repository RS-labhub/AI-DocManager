"use server"

import { revalidatePath } from "next/cache"
import {
  getAIAgents,
  getAIActions,
  getPendingAIActions,
  getAIActionsForDocument,
  createAIAction,
  updateAIAction,
  checkAIPermission,
  generateAIContent,
} from "@/lib/ai-utils"
import type { AIAgent, AIAction } from "@/lib/ai-auth-types"

// Get all AI agents
export async function getAllAIAgents(): Promise<AIAgent[]> {
  return getAIAgents()
}

// Get all AI actions
export async function getAllAIActions(): Promise<AIAction[]> {
  return getAIActions()
}

// Get pending AI actions
export async function getAllPendingAIActions(): Promise<AIAction[]> {
  return getPendingAIActions()
}

// Get AI actions for a document
export async function getDocumentAIActions(documentId: string): Promise<AIAction[]> {
  return getAIActionsForDocument(documentId)
}

// Request an AI action
export async function requestAIAction(
  agentId: string,
  actionType: string,
  resourceType: string,
  resourceId: string,
  documentTitle: string,
  documentContent: string,
  metadata: Record<string, any>,
): Promise<{ success: boolean; action?: AIAction; message?: string }> {
  try {
    console.log(`Requesting AI action: ${actionType} on ${resourceType}:${resourceId} by ${agentId}`)

    // Check if the AI agent has permission for this action
    const permissionCheck = checkAIPermission(agentId, actionType, resourceType, resourceId)
    console.log("Permission check result:", permissionCheck)

    if (!permissionCheck.permitted) {
      return {
        success: false,
        message: "AI agent does not have permission for this action",
      }
    }

    // Generate AI content based on action type using our API
    console.log("Generating AI content...")
    try {
      const aiContent = await generateAIContent(actionType, documentTitle, documentContent)
      console.log("Generated AI content:", aiContent)

      // Check if there was an error in the AI content generation
      if (aiContent.result && aiContent.result.startsWith("Error generating AI content:")) {
        // If it's an error but we have fallback content, we'll still create the action
        if (!aiContent.result.includes("Fallback content:")) {
          return {
            success: false,
            message: aiContent.result,
          }
        }
        // Otherwise, we'll continue with the fallback content
        console.log("Using fallback content due to API error")
      }

      // Merge the generated content with the provided metadata
      const enrichedMetadata = {
        ...metadata,
        ...aiContent,
      }

      // If the action requires approval, set status to pending
      if (permissionCheck.requiresApproval) {
        // Create the action request with pending status
        const action = createAIAction(agentId, actionType, resourceType, resourceId, enrichedMetadata, "pending")
        console.log("Created pending AI action:", action)

        revalidatePath(`/documents/${resourceId}`)
        revalidatePath("/admin/ai-actions")

        return {
          success: true,
          action,
          message: "Action request created and pending approval",
        }
      } else {
        // If no approval required, automatically set to completed
        const action = createAIAction(agentId, actionType, resourceType, resourceId, enrichedMetadata, "completed")
        console.log("Created completed AI action:", action)

        revalidatePath(`/documents/${resourceId}`)
        revalidatePath("/admin/ai-actions")

        // Check if we used fallback content
        if (aiContent.result && aiContent.result.includes("Fallback content:")) {
          return {
            success: true,
            action,
            message: "Action completed with fallback content (AI API unavailable)",
          }
        }

        return {
          success: true,
          action,
          message: "Action completed successfully",
        }
      }
    } catch (aiError) {
      console.error("Error generating AI content:", aiError)

      // Try to create an action with error information
      try {
        const errorMetadata = {
          ...metadata,
          error: aiError instanceof Error ? aiError.message : String(aiError),
          result: `Error occurred: ${aiError instanceof Error ? aiError.message : String(aiError)}`,
        }

        // Create an action with the error information
        const action = createAIAction(agentId, actionType, resourceType, resourceId, errorMetadata, "failed")

        revalidatePath(`/documents/${resourceId}`)
        revalidatePath("/admin/ai-actions")

        return {
          success: false,
          action,
          message: `AI processing error: ${aiError instanceof Error ? aiError.message : String(aiError)}`,
        }
      } catch (actionError) {
        return {
          success: false,
          message: `AI processing error: ${aiError instanceof Error ? aiError.message : String(aiError)}`,
        }
      }
    }
  } catch (error) {
    console.error("Error requesting AI action:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Approve an AI action
export async function approveAIAction(
  actionId: string,
  userId: string,
): Promise<{ success: boolean; action?: AIAction; message?: string }> {
  try {
    console.log(`Approving AI action: ${actionId} by user ${userId}`)

    // First mark as approved
    const approvedAction = updateAIAction(actionId, "approved", userId)

    if (!approvedAction) {
      return {
        success: false,
        message: "Action not found",
      }
    }

    // Then mark as completed
    const completedAction = updateAIAction(actionId, "completed", undefined, approvedAction.metadata.result)

    revalidatePath(`/documents/${approvedAction.resourceId}`)
    revalidatePath("/admin/ai-actions")

    return {
      success: true,
      action: completedAction!,
      message: "Action approved and executed successfully",
    }
  } catch (error) {
    console.error("Error approving AI action:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// Reject an AI action
export async function rejectAIAction(
  actionId: string,
  userId: string,
  reason?: string,
): Promise<{ success: boolean; action?: AIAction; message?: string }> {
  try {
    console.log(`Rejecting AI action: ${actionId} by user ${userId}`)

    const action = updateAIAction(actionId, "rejected", userId)

    if (!action) {
      return {
        success: false,
        message: "Action not found",
      }
    }

    revalidatePath(`/documents/${action.resourceId}`)
    revalidatePath("/admin/ai-actions")

    return {
      success: true,
      action,
      message: "Action rejected successfully",
    }
  } catch (error) {
    console.error("Error rejecting AI action:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
