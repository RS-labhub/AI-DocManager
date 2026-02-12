"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getPendingAIActions, getAIActions } from "@/lib/ai-utils" // Use ai-utils instead of permit-mock
import type { AIAction } from "@/lib/ai-auth-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CheckCircle, XCircle, RefreshCw, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Custom badge styles without hover effects
const statusBadgeStyles = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  failed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
}

const actionBadgeStyles = {
  edit_document: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  improve_document: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  create_document: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  delete_document: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  analyze_document: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  summarize_document: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
}

export default function AIActionsPage() {
  const [pendingActions, setPendingActions] = useState<AIAction[]>([])
  const [allActions, setAllActions] = useState<AIAction[]>([])
  const [loading, setLoading] = useState(true)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Load AI actions
  const loadActions = async () => {
    setLoading(true)
    setError(null)
    try {
      // Use functions from ai-utils
      const pending = getPendingAIActions()
      setPendingActions(pending)

      const all = getAIActions()
      setAllActions(all)

      toast({
        title: "Actions loaded",
        description: `Loaded ${pending.length} pending and ${all.length} total actions`,
      })
    } catch (error) {
      console.error("Failed to load AI actions:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load AI actions"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (user.role !== "admin" && user.role !== "editor") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access this page.",
      })
      router.push("/documents")
      return
    }

    loadActions()
  }, [user, router])

  // Handle approve action
  const handleApprove = async (actionId: string) => {
    if (!user) return

    setProcessingAction(actionId)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Remove the approved action from the pending list
      setPendingActions(pendingActions.filter((action) => action.id !== actionId))

      // Update the action in the all actions list
      setAllActions(
        allActions.map((action) =>
          action.id === actionId
            ? {
                ...action,
                status: "completed",
                completedAt: new Date().toISOString(),
                approvedBy: user.id,
              }
            : action,
        ),
      )

      toast({
        title: "Action Approved",
        description: "Action has been approved and executed successfully",
      })
    } catch (error) {
      console.error("Error approving action:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setProcessingAction(null)
    }
  }

  // Handle reject action
  const handleReject = async (actionId: string) => {
    if (!user) return

    setProcessingAction(actionId)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Remove the rejected action from the pending list
      setPendingActions(pendingActions.filter((action) => action.id !== actionId))

      // Update the action in the all actions list
      setAllActions(
        allActions.map((action) =>
          action.id === actionId
            ? {
                ...action,
                status: "rejected",
                rejectedBy: user.id,
              }
            : action,
        ),
      )

      toast({
        title: "Action Rejected",
        description: "Action has been rejected successfully",
      })
    } catch (error) {
      console.error("Error rejecting action:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setProcessingAction(null)
    }
  }

  // Function to get badge color based on action type
  const getActionBadgeClass = (actionType: keyof typeof actionBadgeStyles) => {
    return actionBadgeStyles[actionType] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Action Approvals</h1>
          <p className="text-muted-foreground">Review and approve AI-requested actions</p>
        </div>
        <Button variant="outline" onClick={loadActions} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
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

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Approvals ({pendingActions.length})</TabsTrigger>
          <TabsTrigger value="history">Action History ({allActions.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          {pendingActions.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">No pending actions</h2>
              <p className="mt-2 text-muted-foreground">There are no AI actions waiting for your approval</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingActions.map((action) => (
                <Card key={action.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getActionBadgeClass(action.actionType as keyof typeof actionBadgeStyles)}`}
                          >
                            {action.actionType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          <span>Resource ID: {action.resourceId}</span>
                        </CardTitle>
                        <CardDescription>
                          Requested by {action.agentId} on {new Date(action.requestedAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeStyles[action.status]}`}
                      >
                        {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Reason:</p>
                      <p className="text-sm text-muted-foreground">{action.metadata.reason || "No reason provided"}</p>

                      {action.metadata.changes && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Proposed Changes:</p>
                          <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(action.metadata.changes, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}

                      {action.metadata.result && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Result:</p>
                          <div className="mt-2 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                            {action.metadata.result}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-3 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleReject(action.id)}
                      disabled={processingAction === action.id}
                    >
                      {processingAction === action.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={() => handleApprove(action.id)}
                      disabled={processingAction === action.id}
                    >
                      {processingAction === action.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          {allActions.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-xl font-semibold">No action history</h2>
              <p className="mt-2 text-muted-foreground">There are no AI actions in the history</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allActions.map((action) => (
                <Card key={action.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getActionBadgeClass(action.actionType as keyof typeof actionBadgeStyles)}`}
                          >
                            {action.actionType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                          <span>Resource ID: {action.resourceId}</span>
                        </CardTitle>
                        <CardDescription>
                          Requested by {action.agentId} on {new Date(action.requestedAt).toLocaleString()}
                        </CardDescription>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeStyles[action.status]}`}
                      >
                        {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Reason:</p>
                      <p className="text-sm text-muted-foreground">{action.metadata.reason || "No reason provided"}</p>

                      {action.status !== "pending" && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {action.status === "approved" && action.approvedBy && `Approved by ${action.approvedBy}`}
                          {action.status === "rejected" && action.rejectedBy && `Rejected by ${action.rejectedBy}`}
                          {action.status === "completed" &&
                            action.completedAt &&
                            `Completed on ${new Date(action.completedAt).toLocaleString()}`}
                        </p>
                      )}

                      {action.result && (
                        <div className="mt-4">
                          <p className="text-sm font-medium">Result:</p>
                          <div className="mt-2 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                            {action.result}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
