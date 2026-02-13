"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { isAtLeast } from "@/lib/permissions"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Plus,
  Search,
  Clock,
  Trash2,
  Eye,
  ArrowRight,
  Filter,
  Building2,
  Lock,
  ClipboardCheck,
  Users,
} from "lucide-react"
import type { Document, Organization } from "@/lib/supabase/types"

export default function DocumentsPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<Document[]>([])
  const [reviewDocs, setReviewDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [orgFilter, setOrgFilter] = useState("all")
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [activeTab, setActiveTab] = useState<"published" | "drafts" | "under_review" | "archived" | "review">("published")
  const isGod = user?.role === "god"

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const supabase = createClient()
      let query = supabase.from("documents").select("*")

      // God sees all but deduplicates by grouping unique docs
      if (user.role === "god") {
        // No org filter — load all
      } else if (user.org_id) {
        // Super admins, admins, users — always scoped to their org
        query = query.eq("org_id", user.org_id)
      }
      // Only non-admins see just their own docs
      if (!isAtLeast(user.role, "admin") && user.role !== "god") {
        query = query.eq("owner_id", user.id)
      }

      const { data } = await query.order("created_at", { ascending: false })
      
      let docs = data || []
      // God: deduplicate docs created across multiple orgs (same title + owner)
      if (user.role === "god" && docs.length > 0) {
        const seen = new Set<string>()
        docs = docs.filter((d) => {
          const key = `${d.title}__${d.owner_id}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
      }
      setDocuments(docs)

      // Load documents pending review by this user
      const { data: reviewData } = await supabase
        .from("documents")
        .select("*")
        .contains("reviewers", [user.id])
        .eq("status", "under_review")
        .order("created_at", { ascending: false })
      setReviewDocs(reviewData || [])

      // Load orgs for god filter
      if (user.role === "god") {
        const { data: orgData } = await supabase.from("organizations").select("*").order("name") as { data: Organization[] | null }
        setOrgs(orgData || [])
      }

      setLoading(false)
    }
    load()
  }, [user])

  const handleDelete = async (id: string) => {
    if (!user) return
    if (!confirm("Are you sure you want to delete this document?")) return
    try {
      const res = await fetch("/api/delete-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: id, userId: user.id, userRole: user.role }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Failed to delete document")
        return
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      setReviewDocs((prev) => prev.filter((d) => d.id !== id))
    } catch {
      alert("Failed to delete document. Please try again.")
    }
  }

  const baseDocs = activeTab === "review"
    ? reviewDocs
    : activeTab === "drafts"
    ? documents.filter((d) => d.status === "draft" && d.owner_id === user?.id)
    : activeTab === "under_review"
    ? documents.filter((d) => d.status === "under_review")
    : activeTab === "archived"
    ? documents.filter((d) => d.status === "archived")
    : documents.filter((d) => d.status === "published" || (!d.status && true))
  const filtered = baseDocs.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      (doc.content && doc.content.toLowerCase().includes(search.toLowerCase()))
    const matchesType =
      typeFilter === "all" || doc.file_type === typeFilter
    const matchesOrg =
      orgFilter === "all" || doc.org_id === orgFilter
    return matchesSearch && matchesType && matchesOrg
  })

  const fileTypes = Array.from(
    new Set(documents.map((d) => d.file_type).filter(Boolean))
  ) as string[]

  if (!user) return null

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {documents.length} document{documents.length !== 1 ? "s" : ""} in your workspace
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button asChild size="sm" className="h-9 gap-1.5">
            <Link href="/dashboard/documents/new">
              <Plus className="h-3.5 w-3.5" /> New Document
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-4 px-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="h-9 w-max sm:w-auto">
            <TabsTrigger value="published" className="text-xs gap-1 px-2 sm:px-3"><FileText className="h-3.5 w-3.5 hidden sm:block" /> Published</TabsTrigger>
            <TabsTrigger value="drafts" className="text-xs gap-1 px-2 sm:px-3">Drafts</TabsTrigger>
            <TabsTrigger value="under_review" className="text-xs gap-1 px-2 sm:px-3">Review</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs gap-1 px-2 sm:px-3">Archived</TabsTrigger>
            <TabsTrigger value="review" className="text-xs gap-1 px-2 sm:px-3">
              For Me
              {reviewDocs.length > 0 && <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[9px] ml-1">{reviewDocs.length}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {fileTypes.length > 0 && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] h-9">
              <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="File Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {fileTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {isGod && orgs.length > 0 && (
          <Select value={orgFilter} onValueChange={setOrgFilter}>
            <SelectTrigger className="w-[200px] h-9">
              <Building2 className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {orgs.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Document List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-10 w-10 text-muted-foreground/20 mb-4" />
            <h3 className="font-medium text-sm">{activeTab === "review" ? "No documents to review" : activeTab === "drafts" ? "No drafts" : activeTab === "archived" ? "No archived documents" : activeTab === "under_review" ? "No documents under review" : "No published documents"}</h3>
            <p className="text-muted-foreground text-xs mt-1 mb-4 text-center max-w-sm">
              {activeTab === "review"
                ? "You don't have any documents assigned for review"
                : activeTab === "drafts"
                ? "Your draft documents will appear here"
                : search || typeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Upload a file or create your first document"}
            </p>
            {!search && typeFilter === "all" && (
              <Button asChild size="sm" className="h-8">
                <Link href="/dashboard/documents/new">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Document
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((doc) => (
            <Card key={doc.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center justify-between p-4">
                <Link
                  href={`/dashboard/documents/${doc.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium truncate">{doc.title}</h3>
                      {doc.ref_number && (
                        <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono text-muted-foreground flex-shrink-0">
                          DOC-{String(doc.ref_number).padStart(5, "0")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                      {doc.file_type && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
                          {doc.file_type.toUpperCase()}
                        </Badge>
                      )}
                      {doc.is_password_protected && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Lock className="h-3 w-3" /> Protected
                        </span>
                      )}
                      {doc.status === "under_review" && (
                        <Badge className="text-[10px] py-0 px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 hover:bg-amber-100">
                          Review
                        </Badge>
                      )}
                      {doc.status === "draft" && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-muted-foreground">
                          Draft
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-1.5 ml-3">
                  {doc.tags && doc.tags.length > 0 && (
                    <Badge variant="secondary" className="hidden sm:inline-flex text-xs">{doc.tags[0]}</Badge>
                  )}
                  <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                    <Link href={`/dashboard/documents/${doc.id}`}>
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  {(doc.owner_id === user.id || (user.role === "god" && doc.is_public) || (user.role !== "god" && isAtLeast(user.role, "admin"))) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
