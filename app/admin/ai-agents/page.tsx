"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getAIAgents } from "@/lib/ai-utils" // Use ai-utils instead of permit-mock
import type { AIAgent, AICapability } from "@/lib/ai-auth-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Loader2, Plus, Settings, AlertTriangle, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AIAgentsPage() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Load AI agents
  const loadAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      // Use the function from ai-utils
      const data = getAIAgents()
      setAgents(data)
      toast({
        title: "Agents loaded",
        description: `Successfully loaded ${data.length} AI agents`,
      })
    } catch (error) {
      console.error("Failed to load AI agents:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load AI agents"
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

    if (user.role !== "admin") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have permission to access this page.",
      })
      router.push("/documents")
      return
    }

    loadAgents()
  }, [user, router])

  // Function to toggle agent active status
  const toggleAgentStatus = (agentId: string, currentStatus: boolean) => {
    try {
      // Update the agents list with the toggled status
      const updatedAgents = agents.map((agent) =>
        agent.id === agentId ? { ...agent, isActive: !currentStatus } : agent,
      )

      setAgents(updatedAgents)

      toast({
        title: "Agent status updated",
        description: `Agent ${currentStatus ? "disabled" : "enabled"} successfully`,
      })
    } catch (error) {
      console.error("Error toggling agent status:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update agent status"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  // Function to get badge color based on capability
  const getCapabilityColor = (capability: AICapability) => {
    // Remove hover styles from these classes
    switch (capability) {
      case "read_documents":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "suggest_edits":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "create_documents":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "edit_documents":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "delete_documents":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "analyze_content":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "summarize_content":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
      case "translate_content":
        return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
      case "generate_content":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  // Function to get a readable name for a capability
  const getCapabilityName = (capability: AICapability) => {
    return capability
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Handle creating a new AI agent
  const handleCreateAgent = () => {
    try {
      // Create a new agent with default values
      const newAgent: AIAgent = {
        id: `ai-assistant-${Date.now()}`,
        name: "New Assistant",
        description: "A new AI assistant with basic capabilities",
        role: "assistant",
        capabilities: ["read_documents", "summarize_content"],
        createdBy: user?.id || "admin-id",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      }

      // Add the new agent to the list
      setAgents([newAgent, ...agents])

      toast({
        title: "Agent created",
        description: "New AI agent created successfully",
      })
    } catch (error) {
      console.error("Error creating agent:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create agent"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  // Handle configuring an agent
  const handleConfigureAgent = (agentId: string) => {
    toast({
      title: "Configure Agent",
      description: `Opening configuration for agent ${agentId}`,
    })
    // In a real app, this would navigate to a configuration page or open a modal
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
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground">Manage AI agents and their permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAgents} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleCreateAgent}>
            <Plus className="mr-2 h-4 w-4" />
            New AI Agent
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Card key={agent.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle>{agent.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={agent.isActive}
                    onCheckedChange={() => toggleAgentStatus(agent.id, agent.isActive)}
                    aria-label={`${agent.isActive ? "Disable" : "Enable"} ${agent.name}`}
                  />
                  <Badge variant={agent.isActive ? "default" : "secondary"}>
                    {agent.isActive ? "Active" : "Disabled"}
                  </Badge>
                </div>
              </div>
              <CardDescription>{agent.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Role</p>
                <Badge variant="outline" className="capitalize">
                  {agent.role}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCapabilityColor(capability)}`}
                    >
                      {getCapabilityName(capability)}
                    </span>
                  ))}
                </div>
              </div>
              {agent.capabilities.some((cap) =>
                ["edit_documents", "delete_documents", "create_documents"].includes(cap),
              ) && (
                <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Has write permissions - review security settings</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-3 flex justify-between">
              <span className="text-xs text-muted-foreground">
                Created {new Date(agent.createdAt).toLocaleDateString()}
              </span>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleConfigureAgent(agent.id)}>
                <Settings className="h-4 w-4" />
                Configure
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
