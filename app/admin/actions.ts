"use server"

import { getDb, UPLOADS_DIR } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { v4 as uuid } from "uuid"
import fs from "fs"
import path from "path"

export async function createConfig(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const content = formData.get("content") as string
  const password = (formData.get("password") as string) || null
  const expiresAt = (formData.get("expires_at") as string) || null

  if (!name || !content) throw new Error("Name and content are required")

  const db = getDb()
  const id = uuid()
  db.prepare(
    `INSERT INTO configs (id, name, content, password, expires_at, enabled) 
     VALUES (?, ?, ?, ?, ?, 1)`
  ).run(id, name.trim(), content, password || null, expiresAt || null)

  revalidatePath("/admin")
}

export async function updateConfig(formData: FormData) {
  const user = await getSession()
  if (!user) throw new Error("Unauthorized")

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const content = formData.get("content") as string
  const password = (formData.get("password") as string) || null
  const expiresAt = (formData.get("expires_at") as string) || null

  if (!id || !name || !content) throw new Error("Missing fields")

  const db = getDb()
  db.prepare(
    `UPDATE configs SET name = ?, content = ?, password = ?, expires_at = ?, updated_at = datetime('now') 
     WHERE id = ?`
  ).run(name.trim(), content, password || null, expiresAt || null, id)

  revalidatePath("/admin")
}

export async function toggleConfig(id: string, enabled: boolean) {
  const user = await getSession()
  if (!user) throw new Error("Unauthorized")

  const db = getDb()
  db.prepare(
    `UPDATE configs SET enabled = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(enabled ? 1 : 0, id)

  revalidatePath("/admin")
}

export async function deleteConfig(id: string) {
  const user = await getSession()
  if (!user) throw new Error("Unauthorized")

  const db = getDb()
  db.prepare("DELETE FROM configs WHERE id = ?").run(id)
  revalidatePath("/admin")
}

export async function toggleFile(id: string, enabled: boolean) {
  const user = await getSession()
  if (!user) throw new Error("Unauthorized")

  const db = getDb()
  db.prepare(
    `UPDATE files SET enabled = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(enabled ? 1 : 0, id)

  revalidatePath("/admin/files")
}

export async function deleteFile(id: string) {
  const user = await getSession()
  if (!user) throw new Error("Unauthorized")

  const db = getDb()

  // Get file path first
  const file = db.prepare("SELECT file_path FROM files WHERE id = ?").get(id) as
    | { file_path: string }
    | undefined

  if (file) {
    const fullPath = path.join(UPLOADS_DIR, file.file_path)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  }

  db.prepare("DELETE FROM files WHERE id = ?").run(id)
  revalidatePath("/admin/files")
}
