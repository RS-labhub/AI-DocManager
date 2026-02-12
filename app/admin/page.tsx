"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { hasPermission, RESOURCES, ACTIONS } from "@/lib/permit-mock" // Import from mock instead
import { Bot, Shield, Bell, Users, Settings, FileText, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    try {
      const canAccessAdminPanel = hasPermission(user.role, ACTIONS.ACCESS, RESOURCES.ADMIN_PANEL)

      if (!canAccessAdminPanel) {
        router.push("/documents")
      }
    } catch (err) {
      console.error("Error checking permissions:", err)
      setError("There was an error checking permissions. Using fallback permissions.")
      // Continue showing the admin panel for admins even if permission check fails
      if (user.role !== "admin") {
        router.push("/documents")
      }
    } finally {
      setLoading(false)
    }
  }, [user, router])

  if (!user || loading) {
    return null
  }

  // Function to handle card click for sections that don't have dedicated pages yet
  const handleCardClick = (section: string) => {
    toast({
      title: `${section} Selected`,
      description: `This feature will be available in a future update.`,
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      <p className="text-muted-foreground">This page is only accessible to administrators.</p>

      {error && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/ai-agents">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-500" />
                <CardTitle>AI Agents</CardTitle>
              </div>
              <CardDescription>Manage AI agents and their capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Configure AI agents, their roles, and what actions they can perform in the system.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/ai-permissions">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <CardTitle>AI Permissions</CardTitle>
              </div>
              <CardDescription>Configure AI access controls</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Set up fine-grained permissions for what AI agents can access and modify in the system.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/ai-actions">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-500" />
                <CardTitle>AI Action Approvals</CardTitle>
              </div>
              <CardDescription>Review and approve AI actions</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Approve or reject actions requested by AI agents that require human authorization.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/user-management">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <CardTitle>User Management</CardTitle>
              </div>
              <CardDescription>Manage users and their permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p>In a real application, this would allow you to manage users, assign roles, and set permissions.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/system-settings">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-500" />
                <CardTitle>System Settings</CardTitle>
              </div>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>In a real application, this would allow you to configure system-wide settings and preferences.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/audit-logs">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                <CardTitle>Audit Logs</CardTitle>
              </div>
              <CardDescription>View system audit logs</CardDescription>
            </CardHeader>
            <CardContent>
              <p>In a real application, this would show a log of all important actions taken in the system.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
