"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, RefreshCw, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Mock system settings
const mockSettings = {
  general: {
    siteName: "DocManager",
    siteDescription: "A document management system with fine-grained authorization",
    allowRegistration: true,
    defaultUserRole: "viewer",
    sessionTimeout: 60, // minutes
  },
  security: {
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    mfaEnabled: false,
    loginAttempts: 5,
    lockoutDuration: 15, // minutes
  },
  notifications: {
    emailNotifications: true,
    documentShared: true,
    documentUpdated: true,
    commentAdded: true,
    systemUpdates: false,
    digestFrequency: "daily",
  },
  storage: {
    maxFileSize: 10, // MB
    allowedFileTypes: ".pdf,.docx,.xlsx,.pptx,.txt",
    storageProvider: "local",
    compressionEnabled: true,
    backupFrequency: "daily",
    retentionPeriod: 30, // days
  },
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<any>(mockSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Load settings
  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      // In a real app, this would be an API call
      setSettings(mockSettings)
      toast({
        title: "Settings loaded",
        description: "System settings loaded successfully",
      })
    } catch (error) {
      console.error("Failed to load settings:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load settings"
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

  // Save settings
  const handleSaveSettings = () => {
    setSaving(true)
    setError(null)
    try {
      // In a real app, this would be an API call
      setTimeout(() => {
        toast({
          title: "Settings saved",
          description: "System settings saved successfully",
        })
        setSaving(false)
      }, 1000)
    } catch (error) {
      console.error("Failed to save settings:", error)
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

  // Update a setting
  const updateSetting = (category: string, key: string, value: any) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    })
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
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
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

      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic system settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={settings.general.siteName}
                  onChange={(e) => updateSetting("general", "siteName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Input
                  id="siteDescription"
                  value={settings.general.siteDescription}
                  onChange={(e) => updateSetting("general", "siteDescription", e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowRegistration">Allow Registration</Label>
                  <p className="text-sm text-muted-foreground">Allow new users to register</p>
                </div>
                <Switch
                  id="allowRegistration"
                  checked={settings.general.allowRegistration}
                  onCheckedChange={(value) => updateSetting("general", "allowRegistration", value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultUserRole">Default User Role</Label>
                <Select
                  value={settings.general.defaultUserRole}
                  onValueChange={(value) => updateSetting("general", "defaultUserRole", value)}
                >
                  <SelectTrigger id="defaultUserRole">
                    <SelectValue placeholder="Select default role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="sessionTimeout"
                    min={5}
                    max={240}
                    step={5}
                    value={[settings.general.sessionTimeout]}
                    onValueChange={(value) => updateSetting("general", "sessionTimeout", value[0])}
                    className="flex-1"
                  />
                  <span className="w-12 text-center">{settings.general.sessionTimeout}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="passwordMinLength"
                    min={6}
                    max={20}
                    step={1}
                    value={[settings.security.passwordMinLength]}
                    onValueChange={(value) => updateSetting("security", "passwordMinLength", value[0])}
                    className="flex-1"
                  />
                  <span className="w-12 text-center">{settings.security.passwordMinLength}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
                  <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
                </div>
                <Switch
                  id="requireSpecialChars"
                  checked={settings.security.requireSpecialChars}
                  onCheckedChange={(value) => updateSetting("security", "requireSpecialChars", value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requireNumbers">Require Numbers</Label>
                  <p className="text-sm text-muted-foreground">Passwords must contain numbers</p>
                </div>
                <Switch
                  id="requireNumbers"
                  checked={settings.security.requireNumbers}
                  onCheckedChange={(value) => updateSetting("security", "requireNumbers", value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requireUppercase">Require Uppercase</Label>
                  <p className="text-sm text-muted-foreground">Passwords must contain uppercase letters</p>
                </div>
                <Switch
                  id="requireUppercase"
                  checked={settings.security.requireUppercase}
                  onCheckedChange={(value) => updateSetting("security", "requireUppercase", value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mfaEnabled">Enable MFA</Label>
                  <p className="text-sm text-muted-foreground">Enable multi-factor authentication</p>
                </div>
                <Switch
                  id="mfaEnabled"
                  checked={settings.security.mfaEnabled}
                  onCheckedChange={(value) => updateSetting("security", "mfaEnabled", value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure email and system notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Enable email notifications</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(value) => updateSetting("notifications", "emailNotifications", value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="documentShared">Document Shared</Label>
                  <p className="text-sm text-muted-foreground">Notify when a document is shared with you</p>
                </div>
                <Switch
                  id="documentShared"
                  checked={settings.notifications.documentShared}
                  onCheckedChange={(value) => updateSetting("notifications", "documentShared", value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="documentUpdated">Document Updated</Label>
                  <p className="text-sm text-muted-foreground">Notify when a document you have access to is updated</p>
                </div>
                <Switch
                  id="documentUpdated"
                  checked={settings.notifications.documentUpdated}
                  onCheckedChange={(value) => updateSetting("notifications", "documentUpdated", value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="commentAdded">Comment Added</Label>
                  <p className="text-sm text-muted-foreground">Notify when a comment is added to your document</p>
                </div>
                <Switch
                  id="commentAdded"
                  checked={settings.notifications.commentAdded}
                  onCheckedChange={(value) => updateSetting("notifications", "commentAdded", value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="digestFrequency">Notification Digest Frequency</Label>
                <Select
                  value={settings.notifications.digestFrequency}
                  onValueChange={(value) => updateSetting("notifications", "digestFrequency", value)}
                >
                  <SelectTrigger id="digestFrequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Storage Settings</CardTitle>
              <CardDescription>Configure document storage settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Maximum File Size (MB)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="maxFileSize"
                    min={1}
                    max={100}
                    step={1}
                    value={[settings.storage.maxFileSize]}
                    onValueChange={(value) => updateSetting("storage", "maxFileSize", value[0])}
                    className="flex-1"
                  />
                  <span className="w-12 text-center">{settings.storage.maxFileSize} MB</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                <Input
                  id="allowedFileTypes"
                  value={settings.storage.allowedFileTypes}
                  onChange={(e) => updateSetting("storage", "allowedFileTypes", e.target.value)}
                  placeholder=".pdf,.docx,.xlsx,.pptx,.txt"
                />
                <p className="text-xs text-muted-foreground">Comma-separated list of file extensions</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storageProvider">Storage Provider</Label>
                <Select
                  value={settings.storage.storageProvider}
                  onValueChange={(value) => updateSetting("storage", "storageProvider", value)}
                >
                  <SelectTrigger id="storageProvider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Storage</SelectItem>
                    <SelectItem value="s3">Amazon S3</SelectItem>
                    <SelectItem value="azure">Azure Blob Storage</SelectItem>
                    <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compressionEnabled">Enable Compression</Label>
                  <p className="text-sm text-muted-foreground">Compress files to save storage space</p>
                </div>
                <Switch
                  id="compressionEnabled"
                  checked={settings.storage.compressionEnabled}
                  onCheckedChange={(value) => updateSetting("storage", "compressionEnabled", value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Settings
        </Button>
      </div>
    </div>
  )
}
