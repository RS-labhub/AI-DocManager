"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Loader2, FileText } from "lucide-react"

export default function Navbar() {
  const { user, logout, isLoading } = useAuth()

  return (
    <header className="backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold group">
            <div className="relative w-8 h-8">
              <Image src="/favicon.png" alt="Document Icon" width={40} height={40} className="object-contain" />
            </div>
            <span className="dark:bg-gradient-to-r dark:from-white dark:to-blue-200 dark:bg-clip-text dark:text-transparent">
              Radhika's AI DocManager
            </span>
          </Link>
          {user && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/documents"
                className="text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors relative group"
              >
                Documents
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary dark:bg-primary transition-all group-hover:w-full"></span>
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm font-medium hover:text-primary dark:hover:text-primary transition-colors relative group"
                >
                  Admin Panel
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary dark:bg-primary transition-all group-hover:w-full"></span>
                </Link>
              )}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm hidden md:inline-block">
                Logged in as <span className="font-medium dark:text-primary">{user.name}</span> ({user.role})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="dark:border-primary/30 dark:hover:border-primary/70 dark:hover:bg-primary/10 transition-all"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="dark:bg-primary dark:hover:bg-primary/90 transition-all">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
