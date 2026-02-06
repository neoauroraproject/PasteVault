import crypto from "crypto"

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
  data: string // base64 encoded file data
  created_at: string
}

export interface Settings {
  admin_password_hash: string
  uploads_enabled: boolean
  max_file_size_mb: number
  allowed_formats: string
}

interface Store {
  pastes: Paste[]
  files: UploadedFile[]
  settings: Settings
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

const DEFAULT_SETTINGS: Settings = {
  admin_password_hash: hashPassword("admin"),
  uploads_enabled: true,
  max_file_size_mb: 50,
  allowed_formats: "jpg,jpeg,png,gif,webp,pdf,zip,rar,7z,txt,doc,docx,xls,xlsx,mp3,mp4",
}

// ---- In-memory store ----
const store: Store = {
  pastes: [],
  files: [],
  settings: { ...DEFAULT_SETTINGS },
}

// ---- Auth (HMAC-signed tokens, no session store needed) ----
export function verifyPassword(password: string): boolean {
  return hashPassword(password) === store.settings.admin_password_hash
}

export function changeAdminPassword(newPassword: string) {
  store.settings.admin_password_hash = hashPassword(newPassword)
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

// ---- Settings ----
export function getSettings(): Omit<Settings, "admin_password_hash"> {
  const { admin_password_hash: _, ...rest } = store.settings
  return rest
}

export function getFullSettings(): Settings {
  return { ...store.settings }
}

export function updateSettings(
  updates: Partial<Pick<Settings, "uploads_enabled" | "max_file_size_mb" | "allowed_formats">>
) {
  if (updates.uploads_enabled !== undefined) store.settings.uploads_enabled = updates.uploads_enabled
  if (updates.max_file_size_mb !== undefined) store.settings.max_file_size_mb = updates.max_file_size_mb
  if (updates.allowed_formats !== undefined) store.settings.allowed_formats = updates.allowed_formats
}

// ---- Pastes ----
export function createPaste(
  content: string,
  language: string,
  password: string | null,
  expiresAt: string | null,
  attachments: PasteAttachment[] = []
): Paste {
  const paste: Paste = {
    id: shortId(6),
    content,
    language,
    password: password || null,
    expires_at: expiresAt || null,
    attachments,
    created_at: new Date().toISOString(),
  }
  store.pastes.unshift(paste)
  return paste
}

export function getPaste(id: string): Paste | null {
  const paste = store.pastes.find((p) => p.id === id)
  if (!paste) return null
  if (paste.expires_at && new Date(paste.expires_at) < new Date()) return null
  return paste
}

export function getAllPastes(): Paste[] {
  return [...store.pastes]
}

export function deletePaste(id: string) {
  store.pastes = store.pastes.filter((p) => p.id !== id)
}

// ---- Files ----
export function createFileRecord(
  originalName: string,
  storedName: string,
  fileSize: number,
  mimeType: string,
  base64Data: string
): UploadedFile {
  const file: UploadedFile = {
    id: shortId(8),
    original_name: originalName,
    stored_name: storedName,
    file_size: fileSize,
    mime_type: mimeType,
    data: base64Data,
    created_at: new Date().toISOString(),
  }
  store.files.unshift(file)
  return file
}

export function getFile(id: string): UploadedFile | null {
  return store.files.find((f) => f.id === id) || null
}

export function getAllFiles(): UploadedFile[] {
  return store.files.map(({ data: _, ...rest }) => ({ ...rest, data: "" }))
}

export function deleteFileRecord(id: string) {
  store.files = store.files.filter((f) => f.id !== id)
}
