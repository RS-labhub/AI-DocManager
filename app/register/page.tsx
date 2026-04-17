"use client"

import React, { useMemo, useState } from "react"
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
  CheckCircle2,
  Eye,
  EyeOff,
  Building2,
  Users,
  ShieldCheck,
  Clock,
} from "lucide-react"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [orgCode, setOrgCode] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const { register, isLoading } = useAuth()

  const strength = useMemo(() => computeStrength(password), [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    const result = await register({
      email,
      password,
      full_name: fullName,
      org_code: orgCode.trim() || undefined,
    })
    if (result.success && result.pending) {
      setPending(true)
    } else if (!result.success) {
      setError(result.error || "Registration failed")
    }
  }

  if (pending) {
    return (
      <AuthShell leftPanel={<RegisterLeftPanel />}>
        <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            Awaiting approval
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Your account has been created and is pending admin approval. You’ll
            be able to sign in once an administrator reviews your request.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild className="h-11">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell leftPanel={<RegisterLeftPanel />}>
      <div className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Join your organisation and start collaborating in minutes.
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
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full name
            </Label>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Jane Doe"
              className="h-11"
            />
          </div>

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
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 8 characters"
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
            {password.length > 0 && <StrengthMeter strength={strength} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgCode" className="text-sm font-medium">
              Organisation code{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="orgCode"
              type="text"
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
              placeholder="ACME01"
              className="h-11 uppercase tracking-wider font-mono"
              maxLength={16}
            />
            <p className="text-[11px] text-muted-foreground">
              Have a code from your admin? Enter it to join their organisation.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 gap-2 shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create account
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
                Have an account?
              </span>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full h-11 mt-4">
            <Link href="/login">Sign in instead</Link>
          </Button>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-6 leading-relaxed">
        By creating an account, you agree to our{" "}
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

function RegisterLeftPanel() {
  return (
    <div className="space-y-8 max-w-md">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-background/60 backdrop-blur-sm text-[11px] font-medium text-muted-foreground">
        <Building2 className="h-3 w-3 text-primary" />
        Join your organisation
      </div>
      <h2 className="text-3xl xl:text-4xl font-semibold tracking-tight leading-tight">
        Create an account,{" "}
        <span className="text-muted-foreground">
          collaborate from day one.
        </span>
      </h2>
      <p className="text-[15px] text-muted-foreground leading-relaxed">
        Your admin reviews each request so only the right people land in your
        workspace.
      </p>

      <div className="grid grid-cols-1 gap-3 pt-2">
        <FeatureRow
          icon={<Users className="h-4 w-4" />}
          title="Team workspaces"
          text="Organisation-scoped documents, roles, and sharing."
        />
        <FeatureRow
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Admin-approved"
          text="No self-serve surprises — every new account is reviewed."
        />
        <FeatureRow
          icon={<CheckCircle2 className="h-4 w-4" />}
          title="Use code or request access"
          text="Enter an org code to join, or wait for admin approval."
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

function computeStrength(pw: string): number {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, 5)
}

function StrengthMeter({ strength }: { strength: number }) {
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong", "Excellent"]
  const colors = [
    "bg-destructive",
    "bg-destructive/80",
    "bg-warning",
    "bg-warning/80",
    "bg-success",
    "bg-success",
  ]
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-5 gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-colors ${
              i < strength ? colors[strength] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {labels[strength]} · use 12+ chars with numbers and symbols
      </p>
    </div>
  )
}
