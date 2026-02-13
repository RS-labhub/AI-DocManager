"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowRight, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [orgSlug, setOrgSlug] = useState("")
  const [orgs, setOrgs] = useState<{ slug: string; name: string }[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  useEffect(() => {
    const loadOrgs = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("organizations")
        .select("slug, name")
        .order("name")
      if (data) setOrgs(data)
    }
    loadOrgs()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await register({
      email,
      password,
      full_name: fullName,
      org_slug: orgSlug || undefined,
    })

    if (!result.success) {
      setError(result.error || "Registration failed")
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-[85vh] px-4 py-8">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background text-sm font-semibold mx-auto mb-4">
            AI
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
                <Label htmlFor="org" className="text-sm">Organization</Label>
                <Select value={orgSlug} onValueChange={setOrgSlug}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select an organization (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map((org) => (
                      <SelectItem key={org.slug} value={org.slug}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  You can join an organization now or later.
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
