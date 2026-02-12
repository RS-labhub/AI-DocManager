"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Shield, FileText, Users, Settings, RefreshCw, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { AIPermissionLevel } from "@/lib/ai-auth-types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Mock permission settings
const mockPermissionSettings = [
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

export default function AIPermissionsPage() {
  const [permissionSettings, setPermissionSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Load permission settings
  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      // Use mock data directly
      setPermissionSettings(mockPermissionSettings)
      toast({
        title: "Settings loaded",
        description: "AI permission settings loaded successfully",
      })
    } catch (error) {
      console.error("Failed to load permission settings:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load permission settings"
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

    loadSettings()
  }, [user, router])

  const handlePermissionLevelChange = (id: string, value: string) => {
    try {
      setPermissionSettings(
        permissionSettings.map((setting) =>
          setting.id === id ? { ...setting, permissionLevel: value as AIPermissionLevel } : setting,
        ),
      )
      toast({
        title: "Permission updated",
        description: "Permission level changed successfully",
      })
    } catch (error) {
      console.error("Error updating permission level:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update permission level"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  const handleRequiresApprovalChange = (id: string, value: boolean) => {
    try {
      setPermissionSettings(
        permissionSettings.map((setting) => (setting.id === id ? { ...setting, requiresApproval: value } : setting)),
      )
      toast({
        title: "Approval setting updated",
        description: `Approval requirement ${value ? "enabled" : "disabled"} successfully`,
      })
    } catch (error) {
      console.error("Error updating approval requirement:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update approval requirement"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  const handleApproverRoleChange = (id: string, value: string) => {
    try {
      setPermissionSettings(
        permissionSettings.map((setting) => (setting.id === id ? { ...setting, approverRoles: [value] } : setting)),
      )
      toast({
        title: "Approver role updated",
        description: "Approver role changed successfully",
      })
    } catch (error) {
      console.error("Error updating approver role:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update approver role"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  const handleSaveSettings = () => {
    setSaving(true)
    setError(null)

    try {
      // Mock saving settings
      setTimeout(() => {
        toast({
          title: "Settings Saved",
          description: "AI permission settings have been updated successfully",
        })
        setSaving(false)
      }, 1000)
    } catch (error) {
      console.error("Error saving settings:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save settings"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
      setSaving(false)
    }
  }

  const handleResetToDefaults = () => {
    try {
      setPermissionSettings(mockPermissionSettings)
      toast({
        title: "Settings Reset",
        description: "AI permission settings have been reset to defaults",
      })
    } catch (error) {
      console.error("Error resetting settings:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to reset settings"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
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
          <h1 className="text-3xl font-bold">AI Permission Settings</h1>
          <p className="text-muted-foreground">Configure what AI agents can access and modify</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSettings} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Settings
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

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Access Controls</CardTitle>
              <CardDescription>Configure what AI agents can do with documents in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {permissionSettings.map((setting) => (
                  <div key={setting.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium">{setting.resourceName || "All Documents"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {setting.resourceId
                            ? `Document ID: ${setting.resourceId}`
                            : "Global setting for all documents"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-500">AI Controls</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor={`permission-level-${setting.id}`}>Permission Level</Label>
                        <Select
                          value={setting.permissionLevel}
                          onValueChange={(value) => handlePermissionLevelChange(setting.id, value)}
                        >
                          <SelectTrigger id={`permission-level-${setting.id}`}>
                            <SelectValue placeholder="Select permission level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={AIPermissionLevel.NO_ACCESS}>No Access</SelectItem>
                            <SelectItem value={AIPermissionLevel.READ_ONLY}>Read Only</SelectItem>
                            <SelectItem value={AIPermissionLevel.SUGGEST_ONLY}>Suggest Only</SelectItem>
                            <SelectItem value={AIPermissionLevel.FULL_ACCESS}>Full Access</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {setting.permissionLevel === AIPermissionLevel.NO_ACCESS &&
                            "AI agents cannot access this document at all"}
                          {setting.permissionLevel === AIPermissionLevel.READ_ONLY &&
                            "AI agents can only read this document, but cannot modify it"}
                          {setting.permissionLevel === AIPermissionLevel.SUGGEST_ONLY &&
                            "AI agents can suggest changes, but all changes require human approval"}
                          {setting.permissionLevel === AIPermissionLevel.FULL_ACCESS &&
                            "AI agents have full access to read and modify this document"}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor={`requires-approval-${setting.id}`}>Require Approval</Label>
                            <p className="text-xs text-muted-foreground">Require human approval for AI actions</p>
                          </div>
                          <Switch
                            id={`requires-approval-${setting.id}`}
                            checked={setting.requiresApproval}
                            onCheckedChange={(value) => handleRequiresApprovalChange(setting.id, value)}
                            disabled={setting.permissionLevel === AIPermissionLevel.NO_ACCESS}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`approver-roles-${setting.id}`}>Approver Roles</Label>
                          <Select
                            defaultValue={setting.approverRoles[0]}
                            disabled={!setting.requiresApproval}
                            onValueChange={(value) => handleApproverRoleChange(setting.id, value)}
                          >
                            <SelectTrigger id={`approver-roles-${setting.id}`}>
                              <SelectValue placeholder="Select approver roles" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin Only</SelectItem>
                              <SelectItem value="admin_editor">Admin & Editor</SelectItem>
                              <SelectItem value="document_owner">Document Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleResetToDefaults}>
                Reset to Defaults
              </Button>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>User Data Access Controls</CardTitle>
              <CardDescription>Configure what AI agents can access about users in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">User permission settings will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Access Controls</CardTitle>
              <CardDescription>Configure what AI agents can access about system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-muted-foreground">System permission settings will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
