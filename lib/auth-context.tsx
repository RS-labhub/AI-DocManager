"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

// Define user types
export type UserRole = "admin" | "editor" | "viewer"

export interface User {
  id: string
  username: string
  name: string
  role: UserRole
}

// Predefined users for demo purposes
const USERS: Record<string, User & { password: string }> = {
  admin: {
    id: "admin-id",
    username: "admin",
    password: "2025DEVChallenge",
    name: "Admin User",
    role: "admin",
  },
  newuser: {
    id: "user-id",
    username: "newuser",
    password: "2025DEVChallenge",
    name: "Regular User",
    role: "editor",
  },
  viewer: {
    id: "viewer-id",
    username: "viewer",
    password: "2025DEVChallenge",
    name: "Viewer User",
    role: "viewer",
  },
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        } catch (e) {
          localStorage.removeItem("user")
        }
      }
      setIsLoading(false)
    }

    // Use setTimeout to ensure this runs after hydration
    setTimeout(checkAuth, 0)
  }, [])

  // Handle redirects based on auth state
  useEffect(() => {
    if (isLoading) return

    // If user is logged in and on login page, redirect to documents
    if (user && (pathname === "/login" || pathname === "/")) {
      router.push("/documents")
    }

    // If user is not logged in and trying to access protected routes
    if (!user && pathname !== "/" && pathname !== "/login") {
      router.push("/login")
    }
  }, [user, isLoading, pathname, router])

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))

    const matchedUser = USERS[username]

    if (matchedUser && matchedUser.password === password) {
      // Remove password before storing in state
      const { password: _, ...userWithoutPassword } = matchedUser

      // Update state and localStorage
      setUser(userWithoutPassword)
      localStorage.setItem("user", JSON.stringify(userWithoutPassword))

      toast({
        title: "Login successful",
        description: `Welcome back, ${userWithoutPassword.name}!`,
      })

      setIsLoading(false)

      // Explicitly navigate to documents page
      router.push("/documents")
      return true
    }

    toast({
      variant: "destructive",
      title: "Login failed",
      description: "Invalid username or password",
    })

    setIsLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")

    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })

    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
