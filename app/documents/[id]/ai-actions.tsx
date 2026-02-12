"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Bot, Sparkles, CheckCircle, XCircle, RefreshCw, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { AIAction } from "@/lib/ai-auth-types"

// Custom badge styles to prevent hover effects
const statusBadgeStyles = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

interface AIActionsProps {
  documentId: string
  documentTitle: string
  documentContent: string
  userId: string
  userRole: string
  onApplySuggestion?: (title: string, content: string) => void
}

export default function AIActions({
  documentId,
  documentTitle,
  documentContent,
  userId,
  userRole,
  onApplySuggestion,
}: AIActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [aiActions, setAiActions] = useState<AIAction[]>([])
  const [aiSuggestion, setAiSuggestion] = useState<AIAction | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load AI actions for this document
  const loadAIActions = async () => {
    try {
      setRefreshing(true)
      setError(null)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // No actions by default
      setAiActions([])
      setAiSuggestion(null)

      toast({
        title: "Actions refreshed",
        description: "AI actions have been refreshed",
      })
    } catch (error) {
      console.error("Error loading AI actions:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load AI actions"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Load AI actions on component mount
  useEffect(() => {
    loadAIActions()
  }, [documentId])

  const handleAIAction = async (actionType: string) => {
    setLoading(actionType)
    setError(null)
    try {
      toast({
        title: "Processing",
        description: `Generating ${actionType.replace("_", " ")} using AI...`,
      })

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
        throw new Error(`Unknown action type: ${actionType}`)
      }

      try {
        // Call the API route
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
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `API request failed with status ${response.status}`)
        }

        const data = await response.json()

        // Create a mock action with the real AI response
        const mockAction: AIAction = {
          id: `action-${Date.now()}`,
          agentId: actionType === "improve_document" ? "ai-editor-1" : "ai-assistant-1",
          actionType,
          resourceType: "document",
          resourceId: documentId,
          status: "completed",
          requestedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          requestedBy: actionType === "improve_document" ? "ai-editor-1" : "ai-assistant-1",
          metadata: {
            reason: `User requested ${actionType.replace("_", " ")}`,
            documentTitle,
          },
          result: data.result,
        }

        // For improve_document, add the changes to metadata
        if (actionType === "improve_document") {
          // Check if result is an object with title and content
          if (data.result && typeof data.result === "object" && "title" in data.result && "content" in data.result) {
            mockAction.metadata.changes = {
              title: data.result.title,
              content: data.result.content,
            }
            mockAction.result = "Document improvement suggestions generated"
          } else if (typeof data.result === "string") {
            // If it's just a string, use it as the result
            mockAction.result = data.result
          }
          setAiSuggestion(mockAction)
        }

        // Add the action to the list
        setAiActions([mockAction, ...aiActions])

        toast({
          title: "AI Action Completed",
          description: `${actionType.replace("_", " ")} has been completed successfully`,
        })
      } catch (apiError) {
        console.error("API error:", apiError)
        throw apiError
      }
    } catch (error) {
      console.error("Error requesting AI action:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to process AI action"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setLoading(null)
    }
  }

  const handleAcceptSuggestion = () => {
    if (aiSuggestion?.metadata?.changes && onApplySuggestion) {
      const { title, content } = aiSuggestion.metadata.changes
      onApplySuggestion(title, content)

      toast({
        title: "Suggestion Applied",
        description: "The AI suggestion has been applied to the document",
      })

      setAiSuggestion(null)
    }
  }

  const handleRejectSuggestion = () => {
    toast({
      title: "Suggestion Rejected",
      description: "The AI suggestion has been rejected",
    })
    setAiSuggestion(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium">AI Actions</h3>
        </div>
        <Button variant="outline" size="sm" onClick={loadAIActions} disabled={refreshing} className="h-8 px-2 text-xs">
          {refreshing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {aiSuggestion ? (
        <Card className="border-blue-200">
          <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  AI Suggestion
                </CardTitle>
                <CardDescription>The AI has suggested changes to this document</CardDescription>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  statusBadgeStyles[aiSuggestion.status as keyof typeof statusBadgeStyles] || "bg-gray-100 text-gray-800"
                }`}
              >
                {aiSuggestion.status === "pending" ? "Pending Approval" : aiSuggestion.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <p className="text-sm font-medium">Reason:</p>
              <p className="text-sm text-muted-foreground">{aiSuggestion.metadata.reason}</p>

              {aiSuggestion.metadata.changes && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Suggested Changes:</p>
                  <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                    <p className="font-medium">Title:</p>
                    <p className="mb-2">{aiSuggestion.metadata.changes.title}</p>
                    <p className="font-medium">Content:</p>
                    <p className="whitespace-pre-wrap">{aiSuggestion.metadata.changes.content}</p>
                  </div>
                </div>
              )}

              {aiSuggestion.result && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Result:</p>
                  <div className="mt-2 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                    <p>{aiSuggestion.result}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-3 flex justify-end gap-2">
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleRejectSuggestion}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button
              variant="outline"
              className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={handleAcceptSuggestion}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Accept
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            onClick={() => handleAIAction("summarize_document")}
            disabled={loading !== null}
          >
            {loading === "summarize_document" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Bot className="h-5 w-5 text-blue-500" />
            )}
            <div className="text-center">
              <p className="font-medium">Summarize</p>
              <p className="text-xs text-muted-foreground">Generate a concise summary</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center justify-center gap-2"
            onClick={() => handleAIAction("analyze_document")}
            disabled={loading !== null}
          >
            {loading === "analyze_document" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Bot className="h-5 w-5 text-purple-500" />
            )}
            <div className="text-center">
              <p className="font-medium">Analyze</p>
              <p className="text-xs text-muted-foreground">Analyze content and topics</p>
            </div>
          </Button>

          {/* Only show improve button for non-viewer users */}
          {userRole !== "viewer" && (
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center justify-center gap-2"
              onClick={() => handleAIAction("improve_document")}
              disabled={loading !== null}
            >
              {loading === "improve_document" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Bot className="h-5 w-5 text-green-500" />
              )}
              <div className="text-center">
                <p className="font-medium">Improve</p>
                <p className="text-xs text-muted-foreground">Suggest content improvements</p>
              </div>
            </Button>
          )}
        </div>
      )}

      {aiActions.length > 0 && !aiSuggestion && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Recent AI Actions</h4>
          <div className="space-y-3">
            {aiActions.map((action) => (
              <Card key={action.id} className="overflow-hidden">
                <CardHeader className="py-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">
                      {action.actionType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </CardTitle>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        statusBadgeStyles[action.status as keyof typeof statusBadgeStyles] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="py-0">
                  {action.result && (
                    <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {action.result}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="py-2 text-xs text-muted-foreground">
                  {new Date(action.requestedAt).toLocaleString()}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
