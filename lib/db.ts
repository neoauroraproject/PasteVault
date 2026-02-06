"use server"

import fs from "fs"
import path from "path"
import crypto from "crypto"

// ---- Types ----
export interface Paste {
  id: string
  content: string
  language: string
  password: string | null
  expires_at: string | null
  created_at: string
}

export interface UploadedFile {
  id: string
  original_name: string
  stored_name: string
  file_size: number
  mime_type: string
  created_at: string
}

export interface Settings {
  admin_password_hash: string
  uploads_enabled: boolean
  max_file_size_mb: number
  allowed_formats: string // comma-separated, e.g. "jpg,png,pdf,zip"
}

interface Store {
  pastes: Paste[]
  files: UploadedFile[]
  settings: Settings
  sessions: Record<string, string> // sessionId -> expiresAt
}

// ---- Paths ----
const DATA_DIR = path.join(process.cwd(), "data")
const DB_FILE = path.join(DATA_DIR, "store.json")
const UPLOADS_DIR = path.join(DATA_DIR, "uploads")

export function getUploadsDir() {
  try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }) } catch {}
  return UPLOADS_DIR
}

// Default password "admin" hashed with simple sha256 for portability (no native deps)
function hashPassword(pw: string): string {
  return crypto.createHash("sha256").update(pw).digest("hex")
}

const DEFAULT_SETTINGS: Settings = {
  admin_password_hash: hashPassword("admin"),
  uploads_enabled: true,
  max_file_size_mb: 50,
  allowed_formats: "jpg,jpeg,png,gif,webp,pdf,zip,rar,7z,txt,doc,docx,xls,xlsx,mp3,mp4",
}

// ---- Store singleton ----
let _store: Store | null = null

function loadStore(): Store {
  if (_store) return _store

  try { fs.mkdirSync(DATA_DIR, { recursive: true }) } catch {}
  try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }) } catch {}

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8")
    _store = JSON.parse(raw) as Store
    // ensure all fields exist (migration-safe)
    if (!_store.settings) _store.settings = { ...DEFAULT_SETTINGS }
    if (!_store.sessions) _store.sessions = {}
    if (!_store.pastes) _store.pastes = []
    if (!_store.files) _store.files = []
    if (_store.settings.allowed_formats === undefined) _store.settings.allowed_formats = DEFAULT_SETTINGS.allowed_formats
    if (_store.settings.uploads_enabled === undefined) _store.settings.uploads_enabled = true
    if (_store.settings.max_file_size_mb === undefined) _store.settings.max_file_size_mb = 50
  } catch {
    _store = {
      pastes: [],
      files: [],
      settings: { ...DEFAULT_SETTINGS },
      sessions: {},
    }
  }
  return _store
}

function saveStore() {
  const store = loadStore()
  try { fs.mkdirSync(DATA_DIR, { recursive: true }) } catch {}
  fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2))
}

// ---- Auth ----
export function verifyPassword(password: string): boolean {
  const store = loadStore()
  return hashPassword(password) === store.settings.admin_password_hash
}

export function changeAdminPassword(newPassword: string) {
  const store = loadStore()
  store.settings.admin_password_hash = hashPassword(newPassword)
  saveStore()
}

export function createSession(): string {
  const store = loadStore()
  const id = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  store.sessions[id] = expiresAt
  saveStore()
  return id
}

export function validateSession(sessionId: string): boolean {
  const store = loadStore()
  const expiresAt = store.sessions[sessionId]
  if (!expiresAt) return false
  if (new Date(expiresAt) < new Date()) {
    delete store.sessions[sessionId]
    saveStore()
    return false
  }
  return true
}

export function deleteSession(sessionId: string) {
  const store = loadStore()
  delete store.sessions[sessionId]
  saveStore()
}

// ---- Settings ----
export function getSettings(): Settings {
  return { ...loadStore().settings }
}

export function updateSettings(updates: Partial<Pick<Settings, "uploads_enabled" | "max_file_size_mb" | "allowed_formats">>) {
  const store = loadStore()
  if (updates.uploads_enabled !== undefined) store.settings.uploads_enabled = updates.uploads_enabled
  if (updates.max_file_size_mb !== undefined) store.settings.max_file_size_mb = updates.max_file_size_mb
  if (updates.allowed_formats !== undefined) store.settings.allowed_formats = updates.allowed_formats
  saveStore()
}

// ---- Pastes ----
export function createPaste(content: string, language: string, password: string | null, expiresAt: string | null): Paste {
  const store = loadStore()
  const paste: Paste = {
    id: crypto.randomUUID(),
    content,
    language,
    password: password || null,
    expires_at: expiresAt || null,
    created_at: new Date().toISOString(),
  }
  store.pastes.unshift(paste)
  saveStore()
  return paste
}

export function getPaste(id: string): Paste | null {
  const store = loadStore()
  const paste = store.pastes.find((p) => p.id === id)
  if (!paste) return null
  // Check expiration
  if (paste.expires_at && new Date(paste.expires_at) < new Date()) return null
  return paste
}

export function getAllPastes(): Paste[] {
  return [...loadStore().pastes]
}

export function deletePaste(id: string) {
  const store = loadStore()
  store.pastes = store.pastes.filter((p) => p.id !== id)
  saveStore()
}

// ---- Files ----
export function createFileRecord(originalName: string, storedName: string, fileSize: number, mimeType: string): UploadedFile {
  const store = loadStore()
  const file: UploadedFile = {
    id: crypto.randomUUID(),
    original_name: originalName,
    stored_name: storedName,
    file_size: fileSize,
    mime_type: mimeType,
    created_at: new Date().toISOString(),
  }
  store.files.unshift(file)
  saveStore()
  return file
}

export function getFile(id: string): UploadedFile | null {
  const store = loadStore()
  return store.files.find((f) => f.id === id) || null
}

export function getAllFiles(): UploadedFile[] {
  return [...loadStore().files]
}

export function deleteFileRecord(id: string) {
  const store = loadStore()
  const file = store.files.find((f) => f.id === id)
  if (file) {
    // Delete physical file
    try {
      const filePath = path.join(UPLOADS_DIR, file.stored_name)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    } catch {}
  }
  store.files = store.files.filter((f) => f.id !== id)
  saveStore()
}
