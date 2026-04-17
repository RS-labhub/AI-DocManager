"use client"

/* ═══════════════════════════════════════════════════════════════
   Public page view — anonymous, read-only.
   Served from /p/<id>. The proxy whitelists this path + the
   /api/pages/<id>/public JSON endpoint so visitors don't need to
   be logged in. The server only returns a page when its
   visibility is exactly 'public_link'; everything else 404s.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Globe, ArrowLeft } from "lucide-react"

const PageEditor = dynamic(
  () => import("@/components/pages/page-editor").then((m) => m.PageEditor),
  {
    ssr: false,
    loading: () => (
      <div className="container mx-auto max-w-4xl px-3 sm:px-4 py-6 space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    ),
  }
)

interface PublicPage {
  id: string
  title: string
  emoji: string | null
  cover_url: string | null
  content: unknown[]
  markdown_cache: string
  updated_at: string
}

export default function PublicPageView() {
  const params = useParams()
  const id = typeof params?.id === "string" ? params.id : ""
  const [page, setPage] = useState<PublicPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/pages/${id}/public`, {
          // No credentials on purpose — this endpoint is public and
          // we don't want to accidentally elevate to an auth context.
          credentials: "omit",
        })
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const json = await res.json()
        setPage(json.page as PublicPage)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-28 sm:h-32 md:h-48 bg-muted/40 animate-pulse" />
        <div className="container mx-auto max-w-4xl px-3 sm:px-4 py-6 space-y-3">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 text-center">
        <Globe className="h-10 w-10 text-muted-foreground mb-3" />
        <h1 className="text-xl font-semibold mb-1">Page not available</h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          This page may have been removed, archived, or is no longer shared
          publicly.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Go home
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover */}
      <div className="relative h-28 sm:h-36 md:h-52 w-full bg-gradient-to-br from-muted to-muted/40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.cover_url || "/cover-image.png"}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      {/* Emoji + title */}
      <div className="container mx-auto max-w-4xl px-3 sm:px-4">
        <div className="relative -mt-7 sm:-mt-8 mb-2 flex items-end justify-between gap-2">
          <span className="inline-block text-4xl sm:text-5xl leading-none bg-background rounded-md px-2 py-1 shadow-sm border">
            {page.emoji || "📄"}
          </span>
          <span className="flex items-center gap-1 text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1 mb-1 shrink-0">
            <Globe className="h-3 w-3" />
            <span className="hidden xs:inline sm:inline">Public page</span>
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-1 break-words">
          {page.title || "Untitled"}
        </h1>
        <p className="text-xs text-muted-foreground mb-4">
          Shared on{" "}
          <Link href="/" className="underline underline-offset-2 hover:text-foreground">
            R&apos;s DocManager
          </Link>
        </p>

        <div className="-mx-3 sm:mx-0 overflow-x-hidden">
          <PageEditor
            initialContent={page.content as unknown[]}
            readOnly
          />
        </div>
      </div>
    </div>
  )
}
