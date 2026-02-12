"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, RefreshCw, Trash, Edit, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

// Mock users for demonstration
const mockUsers = [
  {
    id: "admin-id",
    username: "admin",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
  },
  {
    id: "user-id",
    username: "newuser",
    name: "Regular User",
    email: "user@example.com",
    role: "editor",
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
  },
  {
    id: "viewer-id",
    username: "viewer",
    name: "Viewer User",
    email: "viewer@example.com",
    role: "viewer",
    isActive: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
  {
    id: "inactive-id",
    username: "inactive",
    name: "Inactive User",
    email: "inactive@example.com",
    role: "editor",
    isActive: false,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
  },
]

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Load users
  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      // In a real app, this would be an API call
      setUsers(mockUsers)
      toast({
        title: "Users loaded",
        description: `Successfully loaded ${mockUsers.length} users`,
      })
    } catch (error) {
      console.error("Failed to load users:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load users"
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

    loadUsers()
  }, [user, router])

  // Toggle user active status
  const toggleUserStatus = (userId: string, currentStatus: boolean) => {
    try {
      setUsers(users.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u)))
      toast({
        title: "User status updated",
        description: `User ${currentStatus ? "deactivated" : "activated"} successfully`,
      })
    } catch (error) {
      console.error("Error toggling user status:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update user status"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  // Change user role
  const changeUserRole = (userId: string, newRole: string) => {
    try {
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
      toast({
        title: "User role updated",
        description: `User role changed to ${newRole} successfully`,
      })
    } catch (error) {
      console.error("Error changing user role:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to change user role"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  // Create new user
  const handleCreateUser = () => {
    try {
      const newUser = {
        id: `user-${Date.now()}`,
        username: "new.user",
        name: "New User",
        email: "new.user@example.com",
        role: "viewer",
        isActive: true,
        createdAt: new Date().toISOString(),
      }
      setUsers([newUser, ...users])
      toast({
        title: "User created",
        description: "New user created successfully",
      })
    } catch (error) {
      console.error("Error creating user:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create user"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  // Delete user
  const handleDeleteUser = (userId: string) => {
    try {
      setUsers(users.filter((u) => u.id !== userId))
      toast({
        title: "User deleted",
        description: "User deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting user:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete user"
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    }
  }

  // Edit user
  const handleEditUser = (userId: string) => {
    toast({
      title: "Edit user",
      description: `This would open a form to edit user ${userId}`,
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
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users and their permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUsers} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleCreateUser}>
            <Plus className="mr-2 h-4 w-4" />
            New User
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

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{user.name}</CardTitle>
                  <CardDescription>
                    @{user.username} • {user.email}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={user.isActive}
                    onCheckedChange={() => toggleUserStatus(user.id, user.isActive)}
                    aria-label={`${user.isActive ? "Deactivate" : "Activate"} ${user.name}`}
                  />
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor={`role-${user.id}`}>Role</Label>
                  <Select defaultValue={user.role} onValueChange={(value) => changeUserRole(user.id, value)}>
                    <SelectTrigger id={`role-${user.id}`} className="w-[180px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Created on {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-3 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)}>
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleEditUser(user.id)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
