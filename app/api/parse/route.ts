import { NextRequest, NextResponse } from "next/server";
import { parseDocument, getSupportedFormats } from "@/lib/parsers";
import { withAuth } from "@/lib/auth/require";
import { checkRateLimit } from "@/lib/rate-limit";
import { fileTypeFromBuffer } from "file-type";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_DETECTED_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "image/png",
  "image/jpeg",
]);

const PLAINTEXT_EXTS = new Set(["txt", "md", "csv", "json", "html", "htm", "xml"]);

export const POST = withAuth(async (authed, req: NextRequest) => {
  try {
    const rl = await checkRateLimit("parse", authed.id, 10, 300);
    if (rl) return rl;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "No file provided", supportedFormats: getSupportedFormats() },
        { status: 400 }
      );
    }
    if (file.size === 0 || file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File must be 1 byte - 10MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "").toLowerCase();

    if (!PLAINTEXT_EXTS.has(ext)) {
      const detected = await fileTypeFromBuffer(buffer);
      if (!detected || !ALLOWED_DETECTED_MIMES.has(detected.mime)) {
        return NextResponse.json(
          { error: "File type not allowed or could not be detected" },
          { status: 400 }
        );
      }
    }

    const result = await parseDocument(buffer, file.name);

    return NextResponse.json({
      success: true,
      content: result.content,
      metadata: result.metadata,
    });
  } catch (err) {
    console.error("[parse] error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to parse document",
        supportedFormats: getSupportedFormats(),
      },
      { status: 400 }
    );
  }
});

export async function GET() {
  return NextResponse.json({ formats: getSupportedFormats() });
}
