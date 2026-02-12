"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, RefreshCw, AlertTriangle, Search, Download, Filter } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

// Mock audit logs for demonstration
const mockAuditLogs = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    userId: "admin-id",
    userName: "Admin User",
    action: "document.create",
    resourceType: "document",
    resourceId: "doc-123",
    resourceName: "Project Proposal",
    details: "Created new document",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
    userId: "user-id",
    userName: "Regular User",
    action: "document.update",
    resourceType: "document",
    resourceId: "doc-456",
    resourceName: "Meeting Notes",
    details: "Updated document content",
    ipAddress: "192.168.1.2",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  },
  {
    id: "log-3",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    userId: "admin-id",
    userName: "Admin User",
    action: "user.create",
    resourceType: "user",
    resourceId: "user-789",
    resourceName: "New User",
    details: "Created new user account",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
  {
    id: "log-4",
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    userId: "user-id",
    userName: "Regular User",
    action: "document.delete",
    resourceType: "document",
    resourceId: "doc-789",
    resourceName: "Outdated Report",
    details: "Deleted document",
    ipAddress: "192.168.1.2",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  },
  {
    id: "log-5",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    userId: "admin-id",
    userName: "Admin User",
    action: "settings.update",
    resourceType: "settings",
    resourceId: "system-settings",
    resourceName: "System Settings",
    details: "Updated security settings",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  },
]

// Action badge styles
const actionBadgeStyles = {
  "document.create": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "document.update": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "document.delete": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  "user.create": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  "user.update": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  "user.delete": "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
  "settings.update": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [filteredLogs, setFilteredLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Load audit logs
  const loadLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      // In a real app, this would be an API call
      setLogs(mockAuditLogs)
      setFilteredLogs(mockAuditLogs)
      toast({
        title: "Logs loaded",
        description: `Successfully loaded ${mockAuditLogs.length} audit logs`,
      })
    } catch (error) {
      console.error("Failed to load audit logs:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load audit logs"
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

    loadLogs()
  }, [user, router])

  // Filter logs based on search term and action filter
  useEffect(() => {
    let filtered = logs

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.userName.toLowerCase().includes(term) ||
          log.resourceName.toLowerCase().includes(term) ||
          log.details.toLowerCase().includes(term),
      )
    }

    // Filter by action
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter)
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, actionFilter])

  // Export logs as CSV
  const handleExportLogs = () => {
    try {
      toast({
        title: "Exporting logs",
        description: "Audit logs would be exported as CSV in a real application",
      })
    } catch (error) {
      console.error("Error exporting logs:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to export logs"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  // Format action name for display
  const formatActionName = (action: string) => {
    const [resource, actionType] = action.split(".")
    return `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} ${resource}`
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
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">View system audit logs and activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadLogs} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export
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

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-[200px]">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Filter by action" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="document.create">Create Document</SelectItem>
              <SelectItem value="document.update">Update Document</SelectItem>
              <SelectItem value="document.delete">Delete Document</SelectItem>
              <SelectItem value="user.create">Create User</SelectItem>
              <SelectItem value="settings.update">Update Settings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} audit logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No audit logs found matching your criteria</div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={actionBadgeStyles[log.action] || "bg-gray-100 text-gray-800"}>
                        {formatActionName(log.action)}
                      </Badge>
                      <span className="text-sm font-medium">{log.resourceName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                  <p className="text-sm mb-2">{log.details}</p>
                  <div className="flex flex-col md:flex-row md:items-center justify-between text-xs text-muted-foreground">
                    <div>
                      User: <span className="font-medium">{log.userName}</span>
                    </div>
                    <div>IP: {log.ipAddress}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
