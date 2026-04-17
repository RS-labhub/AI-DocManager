"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthShell } from "@/components/auth-shell"
import {
  Loader2,
  ArrowRight,
  AlertCircle,
  Mail,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Something went wrong")
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthShell leftPanel={<ForgotLeftPanel />}>
        <div className="rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            Check your inbox
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            If an account exists for{" "}
            <span className="font-medium text-foreground">{email}</span>, we’ve
            sent a link to reset your password. The link expires in a short
            while, so use it soon.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              variant="outline"
              className="h-11"
              onClick={() => {
                setSent(false)
                setEmail("")
              }}
            >
              Try another email
            </Button>
            <Button asChild className="h-11">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to sign in
              </Link>
            </Button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell leftPanel={<ForgotLeftPanel />}>
      <div className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Forgot your password?
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Enter the email you signed up with and we’ll send you a reset link.
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

          <Button
            type="submit"
            className="w-full h-11 gap-2 shadow-sm"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending link...
              </>
            ) : (
              <>
                Send reset link
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="px-6 pb-6">
          <Button asChild variant="ghost" className="w-full h-11">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}

function ForgotLeftPanel() {
  return (
    <div className="space-y-8 max-w-md">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-background/60 backdrop-blur-sm text-[11px] font-medium text-muted-foreground">
        <KeyRound className="h-3 w-3 text-primary" />
        Account recovery
      </div>
      <h2 className="text-3xl xl:text-4xl font-semibold tracking-tight leading-tight">
        Forgot your password?{" "}
        <span className="text-muted-foreground">
          We’ll get you back in safely.
        </span>
      </h2>
      <p className="text-[15px] text-muted-foreground leading-relaxed">
        We’ll send a single-use link to your email. Click it within a few
        minutes to set a new password and pick up where you left off.
      </p>

      <div className="grid grid-cols-1 gap-3 pt-2">
        <FeatureRow
          icon={<Mail className="h-4 w-4" />}
          title="Email-based reset"
          text="No answers to remember — just the email you signed up with."
        />
        <FeatureRow
          icon={<ShieldCheck className="h-4 w-4" />}
          title="Secure and rate-limited"
          text="Links expire quickly and requests are throttled per address."
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
