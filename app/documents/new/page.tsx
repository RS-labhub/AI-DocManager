"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { createDocument } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { TextExtractor } from "@/components/text-extractor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NewDocumentPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Handle content extracted from uploaded file
  const handleContentExtracted = (extractedContent: string, filename: string) => {
    // Clear any previous errors
    setError(null)

    // Set the title to the filename without extension if no title is set
    if (!title.trim()) {
      const filenameWithoutExt = filename.split(".").slice(0, -1).join(".")
      setTitle(filenameWithoutExt)
    }

    // Set the content
    setContent(extractedContent)

    toast({
      title: "Content extracted",
      description: `Successfully extracted content from ${filename}`,
    })
  }

  // Basic form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Clear any previous errors
    setError(null)

    // Basic validation
    if (!title.trim()) {
      setError("Title is required")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Title is required",
      })
      return
    }

    setLoading(true)

    try {
      // Call the server action directly
      const result = await createDocument(
        {
          title: title.trim(),
          content: content.trim(),
          isPublic,
        },
        user?.id || "",
      )

      console.log("Document created:", result)

      // Show success message
      toast({
        title: "Success",
        description: "Document created successfully",
      })

      // Navigate to documents page
      router.push("/documents")
    } catch (error) {
      console.error("Error creating document:", error)

      const errorMessage = error instanceof Error ? error.message : "Failed to create document"
      setError(errorMessage)

      // Show error message
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  // If user is not logged in, show a message
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
            <CardDescription>You need to be logged in to create documents</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/login")}>Go to Login</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // If user doesn't have permission, show a message
  if (user.role !== "admin" && user.role !== "editor") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Not Authorized</CardTitle>
            <CardDescription>You don't have permission to create documents</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/documents")}>Back to Documents</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Document</CardTitle>
          <CardDescription>Create a new document in your workspace</CardDescription>
        </CardHeader>

        {error && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                <TabsTrigger value="upload">Upload File</TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter document title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter document content"
                    className="min-h-[200px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4 pt-4">
                <TextExtractor onContentExtracted={handleContentExtracted} />

                {content && (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="title-upload">Title</Label>
                    <Input
                      id="title-upload"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter document title"
                    />
                    <div className="space-y-2">
                      <Label htmlFor="content-preview">Content Preview</Label>
                      <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm">{content}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex items-center space-x-2 pt-2">
              <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
              <Label htmlFor="public">Make document public</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/documents")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Document"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
