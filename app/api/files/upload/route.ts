import { getSettings, createFileRecord, getUploadsDir } from "@/lib/db"
import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const settings = getSettings()

    if (!settings.uploads_enabled) {
      return NextResponse.json({ error: "File uploads are disabled" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size
    const maxBytes = settings.max_file_size_mb * 1024 * 1024
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File exceeds ${settings.max_file_size_mb}MB limit` },
        { status: 400 }
      )
    }

    // Check file format
    const ext = file.name.split(".").pop()?.toLowerCase() || ""
    const allowedFormats = settings.allowed_formats.split(",").map((f) => f.trim().toLowerCase()).filter(Boolean)
    if (allowedFormats.length > 0 && !allowedFormats.includes(ext)) {
      return NextResponse.json(
        { error: `File type .${ext} is not allowed. Allowed: ${allowedFormats.join(", ")}` },
        { status: 400 }
      )
    }

    // Save file
    const uploadsDir = getUploadsDir()
    const storedName = `${Date.now()}-${crypto.randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(path.join(uploadsDir, storedName), buffer)

    const record = createFileRecord(file.name, storedName, file.size, file.type || "application/octet-stream")

    return NextResponse.json({ success: true, id: record.id, name: file.name, size: file.size })
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
