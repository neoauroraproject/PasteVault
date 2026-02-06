import { getFile, getUploadsDir } from "@/lib/db"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const file = getFile(id)

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const uploadsDir = getUploadsDir()
  const filePath = path.join(uploadsDir, file.stored_name)

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 })
  }

  const buffer = fs.readFileSync(filePath)

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": file.mime_type || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.original_name)}"`,
      "Content-Length": String(file.file_size),
    },
  })
}
