import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { parseDocument } from "@/lib/parsers"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { documentId } = body

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Fetch the document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, file_url, file_type, title")
      .eq("id", documentId)
      .single()

    if (docError || !doc || !doc.file_url) {
      return NextResponse.json(
        { error: "Document not found or no file attached" },
        { status: 404 }
      )
    }

    // Extract storage path from the file URL
    const parts = doc.file_url.split("/documents/")
    if (parts.length < 2) {
      return NextResponse.json(
        { error: "Invalid file URL format" },
        { status: 400 }
      )
    }
    const storagePath = parts[parts.length - 1]

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(storagePath)

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: downloadError?.message || "Failed to download file" },
        { status: 500 }
      )
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer())

    // Determine filename from storage path
    const filename = storagePath.split("/").pop() || `file.${doc.file_type || "txt"}`

    // Parse the document
    const result = await parseDocument(buffer, filename)

    if (!result.content || result.content.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text content from this file" },
        { status: 422 }
      )
    }

    // Update the document with extracted content
    const { error: updateError } = await (supabase.from("documents") as any)
      .update({ content: result.content })
      .eq("id", documentId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update document content" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      content: result.content,
      metadata: result.metadata,
    })
  } catch (err: any) {
    console.error("Re-parse document error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to re-parse document" },
      { status: 500 }
    )
  }
}
