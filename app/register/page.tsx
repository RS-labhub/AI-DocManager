"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [orgCode, setOrgCode] = useState("")
  const [error, setError] = useState("")
  const [pendingMessage, setPendingMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setPendingMessage("")
    setLoading(true)

    const result = await register({
      email,
      password,
      full_name: fullName,
      org_code: orgCode.trim().toUpperCase() || undefined,
    })

    if (!result.success) {
      if (result.pending) {
        setPendingMessage(
          result.error || "Account created! Your request to join the organization is pending approval from the Super Admin."
        )
      } else {
        setError(result.error || "Registration failed")
      }
    }
    setLoading(false)
  }

  // Show pending approval message
  if (pendingMessage) {
    return (
      <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4">
              <Image src="/logo.png" alt="R's DocManager" width={140} height={32} className="h-8 w-auto object-contain mx-auto" priority />
            </div>
            <h1 className="text-xl font-semibold">Approval Pending</h1>
          </div>
          <Card className="border shadow-sm">
            <CardContent className="pt-6 pb-4 space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Account Created Successfully!</p>
                  <p>{pendingMessage}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                You can log in once a Super Admin approves your request.
              </p>
            </CardContent>
            <CardFooter className="pb-6 flex flex-col gap-3">
              <Button asChild variant="outline" className="w-full h-10">
                <Link href="/login">Go to Login</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <Image src="/logo.png" alt="R's DocManager" width={140} height={32} className="h-8 w-auto object-contain mx-auto" priority />
          </div>
          <h1 className="text-xl font-semibold">Create your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Join an organization and start managing documents</p>
        </div>

        <Card className="border shadow-sm">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6 pb-2">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Jane Doe"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgCode" className="text-sm">Organization Code</Label>
                <Input
                  id="orgCode"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="e.g. ACME2026"
                  maxLength={16}
                  className="h-10 font-mono tracking-wider uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the alphanumeric code provided by your organization.
                  Leave blank to create an account without an organization.
                  A Super Admin must approve your membership before you can access the dashboard.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-4 pb-6">
              <Button type="submit" className="w-full h-10 gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-foreground hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
