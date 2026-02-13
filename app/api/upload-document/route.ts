import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { parseDocument } from "@/lib/parsers"

const PARSEABLE_EXTENSIONS = ["docx", "doc", "txt", "md", "html", "json", "rtf", "odt", "csv"]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const userId = formData.get("userId") as string | null
    const documentId = formData.get("documentId") as string | null

    if (!file || !userId) {
      return NextResponse.json(
        { error: "file and userId are required" },
        { status: 400 }
      )
    }

    // Max 50MB for documents
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be under 50MB" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin"
    const timestamp = Date.now()
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_")
    const storagePath = `${userId}/${timestamp}_${safeName}`

    // Upload to documents bucket
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(storagePath)

    // If documentId provided, update the document record
    if (documentId) {
      const updateData: Record<string, any> = {
        file_url: publicUrl,
        file_size: file.size,
      }

      // Extract content for parseable file types
      if (PARSEABLE_EXTENSIONS.includes(ext)) {
        try {
          const result = await parseDocument(buffer, file.name)
          if (result.content) {
            updateData.content = result.content
          }
        } catch (parseErr) {
          console.error("Content extraction error (non-fatal):", parseErr)
        }
      }

      await (supabase.from("documents") as any).update(updateData).eq("id", documentId)
    }

    return NextResponse.json({
      url: publicUrl,
      path: storagePath,
      size: file.size,
      name: file.name,
      type: file.type,
    })
  } catch (err: any) {
    console.error("Document upload error:", err)
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    )
  }
}
