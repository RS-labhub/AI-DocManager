"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getDocument, updateDocument, deleteDocument } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, ArrowLeft, Trash, Save, Edit, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import AIActions from "./ai-actions"

interface Document {
  id: string
  title: string
  content: string
  ownerId: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export default function DocumentPage({ params }: { params: { id: string } }) {
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const fetchDocument = async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log("Fetching document:", params.id)
      const doc = await getDocument(params.id, user.id)
      console.log("Fetched document:", doc)

      if (doc) {
        setDocument(doc)
        setTitle(doc.title)
        setContent(doc.content)
        setIsPublic(doc.isPublic)
      } else {
        toast({
          variant: "destructive",
          title: "Document not found",
          description: "The document you're looking for doesn't exist or you don't have permission to view it",
        })
        router.push("/documents")
      }
    } catch (error) {
      console.error("Failed to load document:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load document. Please try again later.",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    fetchDocument()
  }, [user, params.id])

  if (!user || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!document) {
    return null
  }

  const isOwner = document.ownerId === user.id
  const isViewer = user.role === "viewer"
  // Admin can always update, owners and editors can update their own or public documents
  const canUpdate = (user.role === "admin" || isOwner || (user.role === "editor" && !isOwner)) && !isViewer
  // Admin can delete any document, owners can delete their own documents
  const canDelete = (user.role === "admin" || isOwner) && !isViewer

  const handleSave = async () => {
    if (!canUpdate) return

    setSaving(true)
    try {
      console.log("Saving document with:", { title, content, isPublic })

      const updatedDoc = await updateDocument(
        document.id,
        {
          title: title.trim(),
          content: content.trim(),
          isPublic,
        },
        user.id,
      )

      console.log("Document updated:", updatedDoc)

      setDocument(updatedDoc)
      setIsEditing(false)

      toast({
        title: "Document updated",
        description: "Your document has been updated successfully",
      })
    } catch (error) {
      console.error("Error saving document:", error)

      // Show a more specific error message
      let errorMessage = "Failed to update document"
      if (error instanceof Error) {
        errorMessage = error.message

        // Special handling for permission errors
        if (error.message.includes("permission")) {
          errorMessage = "You don't have permission to update this document"
        }
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!canDelete) return

    setDeleting(true)
    try {
      console.log(`Attempting to delete document ${document.id} by user ${user.id}`)

      const result = await deleteDocument(document.id, user.id)
      console.log("Delete result:", result)

      toast({
        title: "Document deleted",
        description: "Your document has been deleted successfully",
      })

      // Manually navigate to documents page
      router.push("/documents")
    } catch (error) {
      console.error("Error deleting document:", error)

      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete document",
      })
      setDeleting(false)
    }
  }

  const handleRefresh = () => {
    fetchDocument()
  }

  const handleApplySuggestion = (newTitle: string, newContent: string) => {
    if (canUpdate) {
      setTitle(newTitle)
      setContent(newContent)
      setIsEditing(true)

      // Scroll to the top to show the editing form
      window.scrollTo({ top: 0, behavior: "smooth" })

      toast({
        title: "AI Suggestion Applied",
        description: "You can now review and save the changes",
      })
    } else {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You don't have permission to edit this document",
      })
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/documents")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Documents
        </Button>

        {!isEditing && (
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold h-auto text-xl mb-2"
              />
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle className="text-2xl">{document.title}</CardTitle>
                {isViewer && (
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                    View Only
                  </span>
                )}
              </div>
            )}
            <CardDescription>
              {isOwner ? "You created this document" : "Shared with you"} on{" "}
              {new Date(document.createdAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {canUpdate && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canDelete && (
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-500">
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the document "{document.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[300px]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
                <Label htmlFor="public">Make document public</Label>
              </div>
            </>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{document.content}</p>
            </div>
          )}
        </CardContent>
        {isEditing && (
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setTitle(document.title)
                setContent(document.content)
                setIsPublic(document.isPublic)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      {!isEditing && (
        <div className="mt-6">
          <Separator className="my-4" />
          <AIActions
            documentId={document.id}
            documentTitle={document.title}
            documentContent={document.content}
            userId={user.id}
            userRole={user.role}
            onApplySuggestion={handleApplySuggestion}
          />
        </div>
      )}
    </div>
  )
}
