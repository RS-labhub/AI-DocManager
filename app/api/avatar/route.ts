import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const userId = formData.get("userId") as string | null

    if (!file || !userId) {
      return NextResponse.json({ error: "file and userId are required" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png"
    const allowed = ["jpg", "jpeg", "png", "gif", "webp"]
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 })
    }

    const supabase = createServerClient()
    const filePath = `${userId}/avatar.${ext}`

    // Upload to avatars bucket (upsert to overwrite)
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl

    // Update profile
    await (supabase.from("profiles") as any)
      .update({ avatar_url: avatarUrl })
      .eq("id", userId)

    return NextResponse.json({ url: avatarUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 })
  }
}
