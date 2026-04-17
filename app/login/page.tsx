"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth-shell"
import {
  Loader2,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const { login, isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const result = await login(email, password)
    if (!result.success && !result.pending) {
      setError(result.error || "Invalid email or password")
    }
  }

  return (
    <AuthShell leftPanel={<LoginLeftPanel />}>
      <div className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Sign in to continue to your workspace.
        </p>
      </div>

      <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@company.com"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 gap-2 shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="px-6 pb-6">
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-widest">
              <span className="bg-card px-2 text-muted-foreground">
                New here?
              </span>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full h-11 mt-4">
            <Link href="/register">Create an account</Link>
          </Button>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-6 leading-relaxed">
        By signing in, you agree to our{" "}
        <Link href="/docs#terms" className="underline hover:text-foreground">
          terms
        </Link>{" "}
        and acknowledge our{" "}
        <Link href="/docs#privacy" className="underline hover:text-foreground">
          privacy practices
        </Link>
        .
      </p>
    </AuthShell>
  )
}

function LoginLeftPanel() {
  return (
    <div className="space-y-8 max-w-md">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-background/60 backdrop-blur-sm text-[11px] font-medium text-muted-foreground">
        <Sparkles className="h-3 w-3 text-primary" />
        AI-powered documents
      </div>
      <h2 className="text-3xl xl:text-4xl font-semibold tracking-tight leading-tight">
        Your documents,{" "}
        <span className="text-muted-foreground">
          organised, searchable, and intelligent.
        </span>
      </h2>
      <p className="text-[15px] text-muted-foreground leading-relaxed">
        Sign in to access your workspace, collaborate with your organisation,
        and let AI do the heavy lifting.
      </p>

      <div className="grid grid-cols-1 gap-3 pt-2">
        <FeatureRow
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Role-based access"
          text="Fine-grained permissions, per-document passwords, audit trail."
        />
        <FeatureRow
          icon={<Zap className="h-4 w-4" />}
          title="Instant AI actions"
          text="Summarise, analyse, translate, and Q&A on any document."
        />
      </div>
    </div>
  )
}

function FeatureRow({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border bg-background/50 backdrop-blur-sm">
      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary/10 text-primary border border-primary/15 flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-[12.5px] text-muted-foreground leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  )
}
