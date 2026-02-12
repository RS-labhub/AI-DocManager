"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getDocuments } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, FileText, Lock, Unlock, RefreshCw, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Document {
  id: string
  title: string
  content: string
  ownerId: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Function to load documents
  const loadDocuments = async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log("Loading documents for user:", user.id)
      const docs = await getDocuments(user.id)
      console.log("Loaded documents:", docs)
      setDocuments(docs)
    } catch (error) {
      console.error("Failed to load documents:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load documents. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load documents when component mounts or user changes
  useEffect(() => {
    // If auth is still loading, wait
    if (isLoading) return

    // If user is not logged in, redirect to login
    if (!user) {
      router.push("/login")
      return
    }

    // Load documents once when the component mounts
    loadDocuments()

    // No automatic refresh interval
  }, [user, isLoading])

  // Show loading while checking auth or loading documents
  if (isLoading || (loading && user)) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // If user is not logged in, don't render anything (redirect handled in useEffect)
  if (!user) {
    return null
  }

  const canCreateDocument = user.role === "admin" || user.role === "editor"
  const isViewer = user.role === "viewer"

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          {isViewer && (
            <p className="text-sm text-muted-foreground mt-1">You are in viewer mode. You can only view documents.</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDocuments} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
          {canCreateDocument && (
            <Button asChild>
              <Link href="/documents/new">
                <Plus className="mr-2 h-4 w-4" />
                New Document
              </Link>
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">No documents found</h2>
          <p className="mt-2 text-muted-foreground">
            {canCreateDocument ? "Create your first document to get started" : "You don't have any documents yet"}
          </p>
          {canCreateDocument && (
            <Button asChild className="mt-4">
              <Link href="/documents/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Document
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => {
            const isOwner = doc.ownerId === user.id

            return (
              <Card key={doc.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="truncate">{doc.title}</CardTitle>
                    {doc.isPublic ? (
                      <Unlock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <CardDescription>{isOwner ? "You created this document" : "Shared with you"}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="line-clamp-3">{doc.content}</p>
                </CardContent>
                <CardFooter className="border-t pt-3 flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  </span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/documents/${doc.id}`}>
                      {isViewer ? (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          View Only
                        </>
                      ) : (
                        "View"
                      )}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
