import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { documentId, userId, userRole } = body

    if (!documentId || !userId || !userRole) {
      return NextResponse.json(
        { error: "documentId, userId, and userRole are required" },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Fetch the document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single()

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    const ROLE_WEIGHT: Record<string, number> = {
      god: 100,
      super_admin: 75,
      admin: 50,
      user: 10,
    }

    const isOwner = doc.owner_id === userId

    if (!isOwner) {
      // Verify the requester outranks the owner
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", doc.owner_id)
        .single()

      if (!ownerProfile) {
        return NextResponse.json(
          { error: "Cannot verify document owner. Deletion denied." },
          { status: 403 }
        )
      }

      const ownerWeight = ROLE_WEIGHT[ownerProfile.role] || 0
      const requesterWeight = ROLE_WEIGHT[userRole] || 0

      if (userRole === "god") {
        // God can delete any public doc
        if (!doc.is_public) {
          return NextResponse.json(
            { error: "God can only delete public documents owned by others." },
            { status: 403 }
          )
        }
      } else if (requesterWeight <= ownerWeight) {
        return NextResponse.json(
          { error: "You don't have permission to delete this document." },
          { status: 403 }
        )
      }
    }

    // Delete file from storage if it exists
    if (doc.file_url) {
      try {
        const parts = doc.file_url.split("/documents/")
        if (parts.length >= 2) {
          const storagePath = parts[parts.length - 1]
          await supabase.storage.from("documents").remove([storagePath])
        }
      } catch (storageErr) {
        console.error("Storage deletion error (non-fatal):", storageErr)
      }
    }

    // Find all copies of this document (same title + owner across orgs)
    // This handles the case where God distributed a doc to multiple orgs
    const { data: allCopies } = await supabase
      .from("documents")
      .select("id, file_url")
      .eq("title", doc.title)
      .eq("owner_id", doc.owner_id)

    if (allCopies && allCopies.length > 1) {
      // Delete storage files for all copies (they may share same URL or differ)
      const urlsDeleted = new Set<string>()
      for (const copy of allCopies) {
        if (copy.file_url && !urlsDeleted.has(copy.file_url)) {
          urlsDeleted.add(copy.file_url)
          try {
            const parts = copy.file_url.split("/documents/")
            if (parts.length >= 2) {
              const storagePath = parts[parts.length - 1]
              await supabase.storage.from("documents").remove([storagePath])
            }
          } catch { /* silent */ }
        }
      }

      // Delete all copies from the database
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("title", doc.title)
        .eq("owner_id", doc.owner_id)

      if (deleteError) {
        console.error("Document delete error:", deleteError)
        return NextResponse.json(
          { error: deleteError.message || "Failed to delete document" },
          { status: 500 }
        )
      }
    } else {
      // Single document, just delete it
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId)

      if (deleteError) {
        console.error("Document delete error:", deleteError)
        return NextResponse.json(
          { error: deleteError.message || "Failed to delete document" },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("Delete document error:", err)
    return NextResponse.json(
      { error: err.message || "Failed to delete document" },
      { status: 500 }
    )
  }
}
