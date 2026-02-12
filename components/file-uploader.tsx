"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Upload, FileText, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface FileUploaderProps {
  onContentExtracted: (content: string, filename: string) => void
}

export function FileUploader({ onContentExtracted }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const fileType = selectedFile.name.split(".").pop()?.toLowerCase()

      if (!["docx", "pdf", "ppt", "pptx", "txt"].includes(fileType || "")) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a .docx, .pdf, .ppt/.pptx, or .txt file",
        })
        return
      }

      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type)

      // Add a timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      try {
        // Use the correct API route
        const response = await fetch("/api/parse-document-simple", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log("Response status:", response.status, "Status text:", response.statusText)

        // Check if the response is ok before trying to parse JSON
        if (!response.ok) {
          let errorMessage = `Upload failed with status ${response.status}`

          try {
            // Try to get response as text first
            const responseText = await response.text()
            console.log("Error response text:", responseText)

            // Check if the response is HTML (starts with <!DOCTYPE or <html)
            if (
              responseText &&
              (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html"))
            ) {
              console.error("Received HTML response instead of JSON")
              errorMessage = `Server error: Received HTML instead of JSON. The API route may not exist.`
            }
            // If it's JSON, parse it
            else if (responseText && responseText.trim().startsWith("{")) {
              const errorData = JSON.parse(responseText)
              if (errorData.error) {
                errorMessage = errorData.error
              }
            } else if (responseText) {
              // Otherwise use the text directly
              errorMessage = `Upload failed: ${responseText.substring(0, 100)}`
            }
          } catch (textError) {
            console.error("Failed to get error text:", textError)
            errorMessage = `Upload failed: ${response.statusText || "Unknown error"}`
          }

          throw new Error(errorMessage)
        }

        // Now that we know the response is ok, try to parse the JSON
        const responseText = await response.text()
        console.log("Response text length:", responseText.length)

        if (!responseText || responseText.trim() === "") {
          throw new Error("Server returned an empty response")
        }

        // Check if the response is HTML
        if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
          console.error("Received HTML response instead of JSON")
          throw new Error("Server error: Received HTML instead of JSON. The API route may not exist.")
        }

        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error("Failed to parse API response as JSON:", parseError)
          console.error("Raw response:", responseText.substring(0, 200))
          throw new Error(`Failed to parse API response: ${parseError.message}`)
        }

        if (!data.content) {
          throw new Error("No content extracted from the file")
        }

        toast({
          title: "File uploaded successfully",
          description: "The content has been extracted and added to the document",
        })

        onContentExtracted(data.content, file.name)
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          throw new Error("Request timed out. The file may be too large or the server is busy.")
        }
        throw fetchError
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
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
            <Button onClick={handleUpload} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload and Extract Content
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
