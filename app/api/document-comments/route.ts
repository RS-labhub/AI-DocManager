import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET comments for a document
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get("documentId")

    if (!documentId) {
      return NextResponse.json({ error: "documentId required" }, { status: 400 })
    }

    const { data: comments, error } = await supabase
      .from("document_comments")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user names for comments
    const userIds = [...new Set((comments || []).map((c: any) => c.user_id))]
    let profiles: any[] = []
    if (userIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds)
      profiles = data || []
    }

    const enriched = (comments || []).map((c: any) => {
      const profile = profiles.find((p) => p.id === c.user_id)
      return {
        ...c,
        user_name: profile?.full_name || "Unknown",
        user_avatar: profile?.avatar_url || null,
      }
    })

    return NextResponse.json({ comments: enriched })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST a new comment
export async function POST(req: NextRequest) {
  try {
    const { documentId, userId, content, parentId } = await req.json()

    if (!documentId || !userId || !content?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("document_comments")
      .insert({
        document_id: documentId,
        user_id: userId,
        content: content.trim(),
        parent_id: parentId || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user name
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", userId)
      .single()

    return NextResponse.json({
      comment: {
        ...data,
        user_name: profile?.full_name || "Unknown",
        user_avatar: profile?.avatar_url || null,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE a comment
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const commentId = searchParams.get("id")
    const userId = searchParams.get("userId")

    if (!commentId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Verify ownership or admin
    const { data: comment } = await supabase
      .from("document_comments")
      .select("user_id")
      .eq("id", commentId)
      .single()

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    // Check if user is comment author or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    const isAdmin = profile?.role === "admin" || profile?.role === "super_admin" || profile?.role === "god"

    if (comment.user_id !== userId && !isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    await supabase
      .from("document_comments")
      .delete()
      .eq("id", commentId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
