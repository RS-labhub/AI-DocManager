"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Upload, FileText, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface TextExtractorProps {
  onContentExtracted: (content: string, filename: string) => void
}

export function TextExtractor({ onContentExtracted }: TextExtractorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
    }
  }

  const handleExtract = async () => {
    if (!file) return

    setLoading(true)

    try {
      // For text files, we can read them directly in the browser
      if (file.name.toLowerCase().endsWith(".txt")) {
        const text = await file.text()
        onContentExtracted(text, file.name)
        toast({
          title: "Content extracted",
          description: "Text file content has been extracted successfully",
        })
      } else {
        // For other file types, generate mock content
        const fileType = file.name.split(".").pop()?.toLowerCase() || ""
        const content = generateMockContent(file.name, file.size, fileType)

        onContentExtracted(content, file.name)
        toast({
          title: "Content extracted",
          description: "Mock content has been generated for your document",
        })
      }
    } catch (error) {
      console.error("Error extracting content:", error)
      toast({
        variant: "destructive",
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Failed to extract content",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
  }

  // Generate mock content based on file type
  function generateMockContent(filename: string, size: number, fileType: string): string {
    const fileTypeDescriptions = {
      docx: "Word document",
      pdf: "PDF document",
      ppt: "PowerPoint presentation",
      pptx: "PowerPoint presentation",
      txt: "text file",
    }

    const description = fileTypeDescriptions[fileType] || "document"

    return (
      `# ${filename}\n\n` +
      `This is mock content extracted from your ${description}.\n\n` +
      `The file size is approximately ${(size / 1024).toFixed(1)} KB.\n\n` +
      `File type: ${fileType.toUpperCase()}\n\n` +
      `In a production environment, you would see the actual content of your document here.\n\n` +
      `For testing purposes, this mock content is being generated to allow you to continue testing the application.\n\n` +
      `You can edit this content as needed before creating your document.`
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {!file ? (
          <div className="space-y-4">
            <Label htmlFor="file-upload">Upload Document</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".docx,.pdf,.ppt,.pptx,.txt"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">Supported formats: .docx, .pdf, .ppt, .pptx, .txt</p>
            <p className="text-xs text-muted-foreground">
              Note: Only .txt files will be read directly. Other formats will generate mock content.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="font-medium">{file.name}</span>
                <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFile}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleExtract} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Extract Content
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
