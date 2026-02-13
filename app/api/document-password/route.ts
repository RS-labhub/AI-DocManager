import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// SET or UPDATE password
export async function POST(req: NextRequest) {
  try {
    const { documentId, password, userId } = await req.json()

    if (!documentId || !password || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate 9-digit code
    if (!/^\d{9}$/.test(password)) {
      return NextResponse.json({ error: "Password must be exactly 9 digits" }, { status: 400 })
    }

    // Verify the user owns or has admin access to the document
    const { data: doc } = await supabase
      .from("documents")
      .select("owner_id, org_id")
      .eq("id", documentId)
      .single()

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, org_id")
      .eq("id", userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Only document owner can set password (this is the whole point — protection from admins)
    if (doc.owner_id !== userId) {
      return NextResponse.json({ error: "Only the document owner can set a password" }, { status: 403 })
    }

    const hash = await bcrypt.hash(password, 12)

    // Upsert the password
    const { error } = await supabase
      .from("document_passwords")
      .upsert({
        document_id: documentId,
        password_hash: hash,
        set_by: userId,
      }, { onConflict: "document_id" })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Mark document as password protected
    await supabase
      .from("documents")
      .update({ is_password_protected: true })
      .eq("id", documentId)

    // Audit log
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "document_password_set",
      resource_type: "document",
      resource_id: documentId,
      org_id: doc.org_id,
      details: {},
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// VERIFY password
export async function PUT(req: NextRequest) {
  try {
    const { documentId, password } = await req.json()

    if (!documentId || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const { data } = await supabase
      .from("document_passwords")
      .select("password_hash")
      .eq("document_id", documentId)
      .single()

    if (!data) {
      return NextResponse.json({ error: "No password set for this document" }, { status: 404 })
    }

    const valid = await bcrypt.compare(password, data.password_hash)
    return NextResponse.json({ valid })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// REMOVE password
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get("documentId")
    const userId = searchParams.get("userId")

    if (!documentId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Verify ownership
    const { data: doc } = await supabase
      .from("documents")
      .select("owner_id")
      .eq("id", documentId)
      .single()

    if (!doc || doc.owner_id !== userId) {
      return NextResponse.json({ error: "Only the document owner can remove the password" }, { status: 403 })
    }

    await supabase
      .from("document_passwords")
      .delete()
      .eq("document_id", documentId)

    await supabase
      .from("documents")
      .update({ is_password_protected: false })
      .eq("id", documentId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
