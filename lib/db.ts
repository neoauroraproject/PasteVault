import crypto from "crypto"
import path from "path"

// ---- Types ----
export interface PasteAttachment {
  file_id: string
  name: string
  size: number
  mime_type: string
}

export interface Paste {
  id: string
  content: string
  language: string
  password: string | null
  expires_at: string | null
  attachments: PasteAttachment[]
  created_at: string
}

export interface UploadedFile {
  id: string
  original_name: string
  stored_name: string
  file_size: number
  mime_type: string
  data: string // base64 for memory, file path for sqlite
  created_at: string
}

export interface Settings {
  admin_password_hash: string
  uploads_enabled: boolean
  max_file_size_mb: number
  allowed_formats: string
}

// ---- Helpers ----
function shortId(len = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let result = ""
  const bytes = crypto.randomBytes(len)
  for (let i = 0; i < len; i++) result += chars[bytes[i] % chars.length]
  return result
}

function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(pw).digest("hex")
}

const SECRET = process.env.SESSION_SECRET || "pastevault-secret-key-change-in-production"
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data")

const DEFAULT_SETTINGS: Settings = {
  admin_password_hash: hashPassword(process.env.ADMIN_PASSWORD || "admin"),
  uploads_enabled: true,
  max_file_size_mb: 50,
  allowed_formats: "jpg,jpeg,png,gif,webp,pdf,zip,rar,7z,txt,doc,docx,xls,xlsx,mp3,mp4",
}

// ============================================================
// SQLite backend (used locally on Ubuntu)
// ============================================================
let sqliteDb: any = null
let useSqlite = false

function tryInitSqlite() {
  if (sqliteDb !== undefined && sqliteDb !== null) return true
  if (useSqlite === false && sqliteDb === null) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Database = require("better-sqlite3")
      const fs = require("fs")
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
      const uploadsDir = path.join(DATA_DIR, "uploads")
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

      sqliteDb = new Database(path.join(DATA_DIR, "pastevault.db"))
      sqliteDb.pragma("journal_mode = WAL")

      sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pastes (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL DEFAULT '',
          language TEXT NOT NULL DEFAULT 'plaintext',
          password TEXT,
          expires_at TEXT,
          attachments TEXT NOT NULL DEFAULT '[]',
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY,
          original_name TEXT NOT NULL,
          stored_name TEXT NOT NULL,
          file_size INTEGER NOT NULL DEFAULT 0,
          mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
          file_path TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL
        );
      `)

      // Init default settings if empty
      const existing = sqliteDb.prepare("SELECT COUNT(*) as c FROM settings").get()
      if (existing.c === 0) {
        const ins = sqliteDb.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)")
        ins.run("admin_password_hash", DEFAULT_SETTINGS.admin_password_hash)
        ins.run("uploads_enabled", String(DEFAULT_SETTINGS.uploads_enabled))
        ins.run("max_file_size_mb", String(DEFAULT_SETTINGS.max_file_size_mb))
        ins.run("allowed_formats", DEFAULT_SETTINGS.allowed_formats)
      }

      useSqlite = true
      console.log("[PasteVault] Using SQLite database at", path.join(DATA_DIR, "pastevault.db"))
      return true
    } catch {
      sqliteDb = null
      useSqlite = false
      return false
    }
  }
  return false
}

// Try to init on module load
tryInitSqlite()

// ============================================================
// In-memory backend (v0 preview fallback)
// ============================================================
const g = globalThis as unknown as {
  __pv_pastes?: Paste[]
  __pv_files?: UploadedFile[]
  __pv_settings?: Settings
}

function memPastes(): Paste[] {
  if (!g.__pv_pastes) g.__pv_pastes = []
  return g.__pv_pastes
}
function memFiles(): UploadedFile[] {
  if (!g.__pv_files) g.__pv_files = []
  return g.__pv_files
}
function memSettings(): Settings {
  if (!g.__pv_settings) g.__pv_settings = { ...DEFAULT_SETTINGS }
  return g.__pv_settings
}

// ============================================================
// Auth (works with both backends)
// ============================================================
export function verifyPassword(password: string): boolean {
  const hash = hashPassword(password)
  if (useSqlite) {
    const row = sqliteDb.prepare("SELECT value FROM settings WHERE key = ?").get("admin_password_hash")
    return row?.value === hash
  }
  return hash === memSettings().admin_password_hash
}

export function changeAdminPassword(newPassword: string) {
  const hash = hashPassword(newPassword)
  if (useSqlite) {
    sqliteDb.prepare("UPDATE settings SET value = ? WHERE key = ?").run(hash, "admin_password_hash")
    return
  }
  memSettings().admin_password_hash = hash
}

export function createSessionToken(): string {
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000
  const payload = `admin:${expires}`
  const signature = crypto.createHmac("sha256", SECRET).update(payload).digest("hex")
  return `${Buffer.from(payload).toString("base64")}.${signature}`
}

export function validateSessionToken(token: string): boolean {
  try {
    const [payloadB64, signature] = token.split(".")
    if (!payloadB64 || !signature) return false
    const payload = Buffer.from(payloadB64, "base64").toString("utf-8")
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex")
    if (signature !== expectedSig) return false
    const parts = payload.split(":")
    const expires = parseInt(parts[1], 10)
    return Date.now() < expires
  } catch {
    return false
  }
}

// ============================================================
// Settings
// ============================================================
export function getSettings(): Omit<Settings, "admin_password_hash"> {
  if (useSqlite) {
    const rows: { key: string; value: string }[] = sqliteDb.prepare("SELECT key, value FROM settings").all()
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    return {
      uploads_enabled: map.uploads_enabled !== "false",
      max_file_size_mb: Number(map.max_file_size_mb) || 50,
      allowed_formats: map.allowed_formats || DEFAULT_SETTINGS.allowed_formats,
    }
  }
  const s = memSettings()
  return { uploads_enabled: s.uploads_enabled, max_file_size_mb: s.max_file_size_mb, allowed_formats: s.allowed_formats }
}

export function updateSettings(updates: Partial<Pick<Settings, "uploads_enabled" | "max_file_size_mb" | "allowed_formats">>) {
  if (useSqlite) {
    const stmt = sqliteDb.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
    if (updates.uploads_enabled !== undefined) stmt.run("uploads_enabled", String(updates.uploads_enabled))
    if (updates.max_file_size_mb !== undefined) stmt.run("max_file_size_mb", String(updates.max_file_size_mb))
    if (updates.allowed_formats !== undefined) stmt.run("allowed_formats", updates.allowed_formats)
    return
  }
  const s = memSettings()
  if (updates.uploads_enabled !== undefined) s.uploads_enabled = updates.uploads_enabled
  if (updates.max_file_size_mb !== undefined) s.max_file_size_mb = updates.max_file_size_mb
  if (updates.allowed_formats !== undefined) s.allowed_formats = updates.allowed_formats
}

// ============================================================
// Pastes
// ============================================================
export function createPaste(content: string, language: string, password: string | null, expiresAt: string | null, attachments: PasteAttachment[] = []): Paste {
  const paste: Paste = {
    id: shortId(6),
    content,
    language,
    password: password || null,
    expires_at: expiresAt || null,
    attachments,
    created_at: new Date().toISOString(),
  }
  if (useSqlite) {
    sqliteDb.prepare(
      "INSERT INTO pastes (id, content, language, password, expires_at, attachments, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(paste.id, paste.content, paste.language, paste.password, paste.expires_at, JSON.stringify(paste.attachments), paste.created_at)
  } else {
    memPastes().unshift(paste)
  }
  return paste
}

export function getPaste(id: string): Paste | null {
  let paste: Paste | null = null
  if (useSqlite) {
    const row = sqliteDb.prepare("SELECT * FROM pastes WHERE id = ?").get(id)
    if (!row) return null
    paste = { ...row, attachments: JSON.parse(row.attachments || "[]") }
  } else {
    paste = memPastes().find((p) => p.id === id) || null
  }
  if (!paste) return null
  if (paste.expires_at && new Date(paste.expires_at) < new Date()) return null
  return paste
}

export function getAllPastes(): Paste[] {
  if (useSqlite) {
    const rows = sqliteDb.prepare("SELECT * FROM pastes ORDER BY created_at DESC").all()
    return rows.map((r: any) => ({ ...r, attachments: JSON.parse(r.attachments || "[]") }))
  }
  return [...memPastes()]
}

export function deletePaste(id: string) {
  if (useSqlite) {
    sqliteDb.prepare("DELETE FROM pastes WHERE id = ?").run(id)
    return
  }
  const arr = memPastes()
  const idx = arr.findIndex((p) => p.id === id)
  if (idx !== -1) arr.splice(idx, 1)
}

// ============================================================
// Files
// ============================================================
export function createFileRecord(originalName: string, storedName: string, fileSize: number, mimeType: string, base64Data: string): UploadedFile {
  const id = shortId(8)
  const created_at = new Date().toISOString()

  if (useSqlite) {
    // Write file to disk instead of storing base64 in DB
    const fs = require("fs")
    const filePath = path.join(DATA_DIR, "uploads", storedName)
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"))

    sqliteDb.prepare(
      "INSERT INTO files (id, original_name, stored_name, file_size, mime_type, file_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, originalName, storedName, fileSize, mimeType, filePath, created_at)

    return { id, original_name: originalName, stored_name: storedName, file_size: fileSize, mime_type: mimeType, data: "", created_at }
  }

  const file: UploadedFile = { id, original_name: originalName, stored_name: storedName, file_size: fileSize, mime_type: mimeType, data: base64Data, created_at }
  memFiles().unshift(file)
  return file
}

export function getFile(id: string): UploadedFile | null {
  if (useSqlite) {
    const row = sqliteDb.prepare("SELECT * FROM files WHERE id = ?").get(id)
    if (!row) return null
    // Read file from disk
    try {
      const fs = require("fs")
      const data = fs.readFileSync(row.file_path)
      return { ...row, data: data.toString("base64") }
    } catch {
      return { ...row, data: "" }
    }
  }
  return memFiles().find((f) => f.id === id) || null
}

export function getAllFiles(): UploadedFile[] {
  if (useSqlite) {
    const rows = sqliteDb.prepare("SELECT id, original_name, stored_name, file_size, mime_type, created_at FROM files ORDER BY created_at DESC").all()
    return rows.map((r: any) => ({ ...r, data: "" }))
  }
  return memFiles().map(({ data: _, ...rest }) => ({ ...rest, data: "" }))
}

export function deleteFileRecord(id: string) {
  if (useSqlite) {
    const row = sqliteDb.prepare("SELECT file_path FROM files WHERE id = ?").get(id)
    if (row?.file_path) {
      try { require("fs").unlinkSync(row.file_path) } catch { /* ignore */ }
    }
    sqliteDb.prepare("DELETE FROM files WHERE id = ?").run(id)
    return
  }
  const arr = memFiles()
  const idx = arr.findIndex((f) => f.id === id)
  if (idx !== -1) arr.splice(idx, 1)
}
