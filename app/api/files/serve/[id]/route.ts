import { getDb, UPLOADS_DIR } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

interface FileRow {
  id: string
  name: string
  original_name: string
  file_path: string
  file_size: number
  mime_type: string | null
  expires_at: string | null
  enabled: number
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const db = getDb()
  const file = db
    .prepare("SELECT * FROM files WHERE id = ? AND enabled = 1")
    .get(id) as FileRow | undefined

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (file.expires_at && new Date(file.expires_at) < new Date()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Sanitize path to prevent traversal
  const safePath = path.basename(file.file_path)
  const fullPath = path.join(UPLOADS_DIR, safePath)

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const fileBuffer = fs.readFileSync(fullPath)
  const mimeType = file.mime_type || "application/octet-stream"

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.original_name)}"`,
      "Content-Length": String(file.file_size),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
