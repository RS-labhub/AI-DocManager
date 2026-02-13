"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  Loader2, FileText, LayoutDashboard, Shield, Crown, LogOut,
  ChevronDown, Settings, Key, Plus, BookOpen, Menu,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getRoleInfo } from "@/lib/permissions"
import type { UserRole } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const { user, logout, isLoading } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const roleInfo = user ? getRoleInfo(user.role as UserRole) : null
  const isAdmin = user && (user.role === "admin" || user.role === "super_admin" || user.role === "god")
  const isGod = user && user.role === "god"

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: !!user, exact: true },
    { href: "/dashboard/documents", label: "Documents", icon: FileText, show: !!user, exact: false },
    { href: "/dashboard/users", label: "Users", icon: Shield, show: !!isAdmin, exact: false },
    { href: "/god", label: "God Panel", icon: Crown, show: !!isGod, exact: false },
  ]

  const isActive = (href: string, exact?: boolean) => {
    if (!pathname) return false
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex flex-col h-full">
                {/* Mobile header */}
                <div className="flex items-center gap-2 p-4 border-b">
                  <Image src="/logo.png" alt="R's DocManager" width={100} height={24} className="h-6 w-auto object-contain" />
                  <span className="text-sm font-semibold">R&apos;s DocManager</span>
                </div>

                {/* Mobile user info */}
                {user && (
                  <div className="p-4 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {roleInfo && <span className="text-[10px] font-medium text-primary">{roleInfo.label}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile nav  New Doc at top, highlighted */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                  {user && (
                    <Link href="/dashboard/documents/new" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground mb-2 transition-colors hover:bg-primary/90">
                      <Plus className="h-4 w-4" />
                      New Document
                    </Link>
                  )}

                  {navLinks.filter(l => l.show).map(link => (
                    <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isActive(link.href, link.exact)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}>
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  ))}

                  <Separator className="my-2" />

                  <Link href="/dashboard/docs" onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive("/dashboard/docs")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}>
                    <BookOpen className="h-4 w-4" />
                    Documentation
                  </Link>

                  <Separator className="my-2" />

                  <Link href="/dashboard/settings" onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive("/dashboard/settings", true)
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}>
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link href="/dashboard/settings/ai-keys" onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive("/dashboard/settings/ai-keys")
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}>
                    <Key className="h-4 w-4" />
                    AI API Keys
                  </Link>
                </nav>

                {/* Mobile footer: theme + logout */}
                <div className="border-t p-3 space-y-2">
                  <div className="flex items-center justify-between px-3 py-1">
                    <span className="text-xs text-muted-foreground">Theme</span>
                    <ModeToggle />
                  </div>
                  {user && (
                    <button onClick={() => { setMobileOpen(false); logout(); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  )}
                  {!user && (
                    <div className="flex gap-2 px-3">
                      <Button asChild variant="outline" size="sm" className="flex-1" onClick={() => setMobileOpen(false)}>
                        <Link href="/login">Log in</Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1" onClick={() => setMobileOpen(false)}>
                        <Link href="/register">Get Started</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Logo */}
          <Link href={user ? "/" : "/"} className="flex items-center gap-2 group">
            <Image src="/logo.png" alt="R's DocManager" width={120} height={28} className="h-7 w-auto object-contain" priority />
            <span className="text-sm font-semibold hidden sm:inline-block">R&apos;s DocManager</span>
          </Link>

          {/* Desktop Nav Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 ml-6">
              {navLinks.filter(l => l.show).map(link => (
                <Link key={link.href} href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors",
                    isActive(link.href, link.exact)
                      ? "text-primary font-medium bg-primary/5"
                      : "text-muted-foreground hover:text-foreground"
                  )}>
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {user && (
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex h-9 gap-1.5 text-xs">
              <Link href="/dashboard/docs">
                <BookOpen className="h-3.5 w-3.5" /> Docs
              </Link>
            </Button>
          )}
          {user && (
            <Button asChild size="sm" className="hidden sm:flex h-9 gap-1.5 text-xs">
              <Link href="/dashboard/documents/new">
                <Plus className="h-3.5 w-3.5" /> New Doc
              </Link>
            </Button>
          )}
          {/* Mobile New Doc icon button */}
          {user && (
            <Button asChild size="icon" className="sm:hidden h-8 w-8">
              <Link href="/dashboard/documents/new">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <div className="hidden md:block">
            <ModeToggle />
          </div>

          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{user.full_name}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/settings" className="flex items-center gap-2">
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/dashboard/settings/ai-keys" className="flex items-center gap-2">
                    <Key className="h-3.5 w-3.5" /> AI API Keys
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="h-3.5 w-3.5" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
