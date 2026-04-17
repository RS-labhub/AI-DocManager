"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { PageCover } from "@/components/pages/page-cover"
import { ShareDialog } from "@/components/pages/share-dialog"
import { usePageSidebar } from "@/components/pages/page-sidebar"
import {
  ArrowLeft,
  Share2,
  Loader2,
  MoreHorizontal,
  Download,
  Trash2,
  Archive,
  Lock,
  Globe,
  Building2,
  Users,
  CheckCircle2,
} from "lucide-react"
import type {
  Page,
  PagePermission,
  PageVisibility,
  UserRole,
} from "@/lib/supabase/types"

// BlockNote uses browser-only APIs at module evaluation time; keep it
// client-side and skip SSR to avoid hydration mismatches.
const PageEditor = dynamic(
  () => import("@/components/pages/page-editor").then((m) => m.PageEditor),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto max-w-4xl px-4 py-6 space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    ),
  }
)

const VIS_META: Record<PageVisibility, { label: string; icon: any }> = {
  private: { label: "Private", icon: Lock },
  org: { label: "Org", icon: Building2 },
  role: { label: "Role", icon: Users },
  restricted: { label: "Restricted", icon: Users },
  public_link: { label: "Public link", icon: Globe },
}

type SaveState = "idle" | "saving" | "saved" | "error"

export default function PageEditorPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const sidebar = usePageSidebar()
  const pageId = typeof params?.id === "string" ? params.id : ""

  const [page, setPage] = useState<Page | null>(null)
  const [permission, setPermission] = useState<PagePermission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [saveState, setSaveState] = useState<SaveState>("idle")

  const [shareOpen, setShareOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // --- Load ---
  useEffect(() => {
    if (!pageId) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/pages/${pageId}`, {
          credentials: "include",
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Failed to load page")
        setPage(json.page as Page)
        setPermission(json.permission as PagePermission)
        setTitle((json.page.title as string) ?? "Untitled")
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [pageId])

  const canEdit = permission === "edit" || permission === "full_access"
  const canManage = permission === "full_access"

  // --- Generic patch helper ---
  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      if (!page) return
      setSaveState("saving")
      try {
        const res = await fetch(`/api/pages/${page.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? "Save failed")
        const nextPage = json.page as Page
        setPage(nextPage)
        // Keep the sidebar list in sync without refetching.
        sidebar?.patchLocal(nextPage.id, {
          title: nextPage.title,
          emoji: nextPage.emoji,
          is_archived: nextPage.is_archived,
          visibility: nextPage.visibility,
          updated_at: nextPage.updated_at,
        })
        setSaveState("saved")
        setTimeout(() => {
          setSaveState((s) => (s === "saved" ? "idle" : s))
        }, 1200)
      } catch (err: any) {
        setSaveState("error")
        toast({
          title: "Save failed",
          description: err.message,
          variant: "destructive",
        })
      }
    },
    [page, toast]
  )

  // --- Title debounced save ---
  useEffect(() => {
    if (!page) return
    if (title === page.title) return
    const t = setTimeout(() => {
      patch({ title: title.trim() || "Untitled" })
    }, 600)
    return () => clearTimeout(t)
  }, [title, page, patch])

  // --- Editor change → content + markdown cache ---
  const handleEditorChange = useCallback(
    (payload: { content: unknown[]; markdown: string }) => {
      patch({ content: payload.content, markdown_cache: payload.markdown })
    },
    [patch]
  )

  // --- Delete ---
  async function handleDelete() {
    if (!page) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? "Delete failed")
      }
      sidebar?.removeLocal(page.id)
      toast({ title: "Page deleted" })
      router.push("/dashboard/pages")
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      })
      setDeleting(false)
    }
  }

  async function handleArchiveToggle() {
    if (!page) return
    patch({ is_archived: !page.is_archived })
  }

  // --- Markdown export ---
  async function handleExport() {
    if (!page) return
    const res = await fetch(`/api/pages/${page.id}/markdown`, {
      credentials: "include",
    })
    if (!res.ok) {
      toast({ title: "Export failed", variant: "destructive" })
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const safe = page.title.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 50) || "page"
    a.download = `${safe}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div>
        <div className="h-32 bg-muted/40 animate-pulse" />
        <div className="container mx-auto max-w-4xl px-4 py-8 space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (error || !page || !permission) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-sm text-destructive mb-3">
          {error ?? "Page not available"}
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/pages">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to pages
          </Link>
        </Button>
      </div>
    )
  }

  const VisIcon = VIS_META[page.visibility].icon

  return (
    <div className="pb-20">
      {/* Toolbar */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto max-w-4xl px-3 sm:px-4 h-11 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2 shrink-0">
              <Link href="/dashboard/pages" aria-label="Back to pages">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Badge
              variant="secondary"
              className="gap-1 font-normal text-[11px] shrink-0"
            >
              <VisIcon className="h-3 w-3" />
              <span className="hidden sm:inline">
                {VIS_META[page.visibility].label}
              </span>
            </Badge>
            {page.is_archived && (
              <Badge
                variant="outline"
                className="gap-1 font-normal text-[11px] text-muted-foreground shrink-0"
              >
                <Archive className="h-3 w-3" />
                <span className="hidden sm:inline">Archived</span>
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground ml-1 sm:ml-2 min-w-0 truncate">
              {saveState === "saving" && (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                  <span className="hidden sm:inline">Saving…</span>
                </span>
              )}
              {saveState === "saved" && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span className="hidden sm:inline">Saved</span>
                </span>
              )}
              {saveState === "error" && (
                <span className="text-destructive">
                  <span className="hidden sm:inline">Save failed</span>
                  <span className="sm:hidden">Error</span>
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 sm:px-3 text-xs"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export markdown
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={handleArchiveToggle}>
                    <Archive className="h-4 w-4 mr-2" />
                    {page.is_archived ? "Unarchive" : "Archive"}
                  </DropdownMenuItem>
                )}
                {canManage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteOpen(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Cover + emoji */}
      <PageCover
        pageId={page.id}
        coverUrl={page.cover_url}
        emoji={page.emoji}
        canEdit={canEdit}
        onUpdate={(p) => {
          // For external URL (cover_url string or null) the PATCH endpoint is
          // the right call; upload/delete come through the dedicated endpoint
          // and patch directly on the server.
          if ("cover_url" in p) {
            if (typeof p.cover_url === "string" || p.cover_url === null) {
              // If this arrived from a cover endpoint call, the server already
              // persisted it. Only PATCH if we changed emoji or an external URL.
              patch({ cover_url: p.cover_url })
              return
            }
          }
          if ("emoji" in p) {
            patch({ emoji: p.emoji })
          }
        }}
      />

      {/* Title + editor */}
      <div className="container mx-auto max-w-4xl px-3 sm:px-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          disabled={!canEdit}
          className="w-full bg-transparent text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight outline-none mb-4 placeholder:text-muted-foreground/40"
        />

        <div className="-mx-3 sm:mx-0 overflow-x-hidden">
          <PageEditor
            initialContent={page.content as unknown[]}
            readOnly={!canEdit}
            onChange={handleEditorChange}
          />
        </div>
      </div>

      {/* Share dialog */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        pageId={page.id}
        canManage={canManage}
        initialVisibility={page.visibility}
        initialMinRole={page.min_role}
        onVisibilityChange={({ visibility, min_role }) => {
          setPage((p) => (p ? { ...p, visibility, min_role } : p))
        }}
      />

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this page?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The page and all of its shares will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
