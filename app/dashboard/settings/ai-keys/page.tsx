"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Key, Plus, Trash2, Loader2, Shield, ArrowLeft, AlertCircle, Check, Lock, Zap, Brain, Bot } from "lucide-react"
import Link from "next/link"

interface ApiKeyEntry {
  id: string
  provider: string
  label: string
  masked_key: string
  is_active: boolean
  created_at: string
}

const PROVIDERS = [
  { value: "groq", label: "Groq", desc: "Fast inference, free tier available", icon: Zap, color: "text-orange-500" },
  { value: "openai", label: "OpenAI", desc: "GPT models, most versatile", icon: Brain, color: "text-emerald-500" },
  { value: "anthropic", label: "Anthropic", desc: "Claude models, great for analysis", icon: Bot, color: "text-violet-500" },
]

export default function AiKeysPage() {
  const { user } = useAuth()
  const [keys, setKeys] = useState<ApiKeyEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [provider, setProvider] = useState("groq")
  const [label, setLabel] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadKeys = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/ai-keys?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setKeys(data.keys || [])
      }
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { loadKeys() }, [user])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError(""); setSuccess(""); setSaving(true)
    try {
      const res = await fetch("/api/ai-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, provider, label: label || `${provider} key`, apiKey }),
      })
      if (res.ok) {
        setSuccess("API key added successfully")
        setApiKey(""); setLabel("")
        await loadKeys()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to add key")
      }
    } catch { setError("Failed to connect to server") }
    setSaving(false)
  }

  const handleDelete = async (keyId: string) => {
    if (!confirm("Delete this API key?")) return
    try {
      await fetch(`/api/ai-keys?id=${keyId}`, { method: "DELETE" })
      setKeys((prev) => prev.filter((k) => k.id !== keyId))
    } catch { /* silent */ }
  }

  if (!user) return null
  const selectedProvider = PROVIDERS.find((p) => p.value === provider)

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboard/settings"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI API Keys</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Lock className="h-3 w-3" /> All keys encrypted with AES-256-GCM before storage
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Add Key */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Add New Key</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />{error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs">
                    <Check className="h-3.5 w-3.5 flex-shrink-0" />{success}
                  </div>
                )}

                {/* Provider selector as cards */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Provider</Label>
                  <div className="space-y-2">
                    {PROVIDERS.map((p) => {
                      const Icon = p.icon
                      return (
                        <button key={p.value} type="button" onClick={() => setProvider(p.value)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${provider === p.value ? "border-foreground/30 bg-muted/50 ring-1 ring-foreground/10" : "border-border hover:border-foreground/20"}`}>
                          <Icon className={`h-4 w-4 ${p.color}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{p.label}</p>
                            <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="label" className="text-xs text-muted-foreground">Label (optional)</Label>
                  <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="My key" className="h-9" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="text-xs text-muted-foreground">API Key</Label>
                  <Input id="apiKey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} required placeholder="sk-..." className="h-9 font-mono" />
                </div>

                <Button type="submit" disabled={saving || !apiKey} className="w-full h-9 gap-1.5">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                  Encrypt & Save
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Existing Keys */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5"><Key className="h-3.5 w-3.5" /> Your Keys</CardTitle>
                <Badge variant="outline" className="text-[10px]">{keys.length} key{keys.length !== 1 ? "s" : ""}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : keys.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Key className="h-6 w-6 opacity-30" />
                  </div>
                  <p className="text-sm font-medium">No API keys yet</p>
                  <p className="text-xs mt-1">Add a key to start using AI features</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {keys.map((k) => {
                    const prov = PROVIDERS.find((p) => p.value === k.provider)
                    const Icon = prov?.icon || Key
                    return (
                      <div key={k.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-foreground/10 transition-colors">
                        <div className={`h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-4 w-4 ${prov?.color || "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{k.label}</p>
                            <Badge variant="outline" className="capitalize text-[10px]">{k.provider}</Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] text-muted-foreground">{k.masked_key}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(k.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                          onClick={() => handleDelete(k.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-[10px] text-muted-foreground text-center mt-4 space-y-0.5">
            <p className="flex items-center justify-center gap-1"><Shield className="h-2.5 w-2.5" /> Keys encrypted server-side with AES-256-GCM</p>
            <p>Adding a new key for the same provider deactivates previous keys</p>
          </div>
        </div>
      </div>
    </div>
  )
}
