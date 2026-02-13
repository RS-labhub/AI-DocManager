import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get("documentId")

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Get document details
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("file_url, file_type")
      .eq("id", documentId)
      .single()

    if (docError || !doc || !doc.file_url) {
      return NextResponse.json(
        { error: "Document not found or no file attached" },
        { status: 404 }
      )
    }

    // Extract storage path from file_url
    // file_url format: https://[project].supabase.co/storage/v1/object/public/documents/[path]
    const urlParts = doc.file_url.split("/documents/")
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: "Invalid file URL format" },
        { status: 400 }
      )
    }

    const storagePath = urlParts[1]

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(storagePath)

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError)
      return NextResponse.json(
        { error: downloadError?.message || "Failed to download file" },
        { status: 500 }
      )
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await fileData.arrayBuffer())

    // Determine content type
    const contentType = doc.file_type === "pdf" 
      ? "application/pdf" 
      : "application/octet-stream"

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${storagePath.split("/").pop()}"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (err: any) {
    console.error("Document file fetch error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to fetch file" },
      { status: 500 }
    )
  }
}
