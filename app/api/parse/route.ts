import { NextRequest, NextResponse } from "next/server";
import { parseDocument, getSupportedFormats } from "@/lib/parsers";

export const runtime = "nodejs";

/* ─── POST: parse an uploaded document ────────────────────────── */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided", supportedFormats: getSupportedFormats() },
        { status: 400 }
      );
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse
    const result = await parseDocument(buffer, file.name);

    return NextResponse.json({
      success: true,
      content: result.content,
      metadata: result.metadata,
    });
  } catch (err) {
    console.error("Parse error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to parse document",
        supportedFormats: getSupportedFormats(),
      },
      { status: 400 }
    );
  }
}

/* ─── GET: list supported formats ─────────────────────────────── */

export async function GET() {
  return NextResponse.json({ formats: getSupportedFormats() });
}
