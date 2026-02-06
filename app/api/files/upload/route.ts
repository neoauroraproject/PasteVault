import { getSession } from "@/lib/auth"
import { getDb, UPLOADS_DIR } from "@/lib/db"
import { NextResponse } from "next/server"
import { v4 as uuid } from "uuid"
import fs from "fs"
import path from "path"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: Request) {
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const expiresAt = (formData.get("expires_at") as string) || null

    if (!file || !name) {
      return NextResponse.json({ error: "File and name are required" }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 50MB limit" }, { status: 400 })
    }

    // Sanitize filename to prevent path traversal
    const ext = path.extname(file.name).replace(/[^a-zA-Z0-9.]/g, "")
    const safeName = `${Date.now()}-${uuid()}${ext}`

    // Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = path.join(UPLOADS_DIR, safeName)
    fs.writeFileSync(filePath, buffer)

    // Create database record
    const db = getDb()
    const id = uuid()
    db.prepare(
      `INSERT INTO files (id, name, original_name, file_path, file_size, mime_type, expires_at, enabled) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
    ).run(id, name.trim(), file.name, safeName, file.size, file.type || "application/octet-stream", expiresAt || null)

    return NextResponse.json({ success: true, id })
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
