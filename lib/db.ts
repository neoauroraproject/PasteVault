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
  data: string
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

const DEFAULT_SETTINGS: Settings = {
  admin_password_hash: hashPassword("admin"),
  uploads_enabled: true,
  max_file_size_mb: 50,
  allowed_formats: "jpg,jpeg,png,gif,webp,pdf,zip,rar,7z,txt,doc,docx,xls,xlsx,mp3,mp4",
}

// ---- Global store (survives across requests in same process) ----
const globalStore = globalThis as unknown as {
  __pv_pastes?: Paste[]
  __pv_files?: UploadedFile[]
  __pv_settings?: Settings
}

function getPastes(): Paste[] {
  if (!globalStore.__pv_pastes) globalStore.__pv_pastes = []
  return globalStore.__pv_pastes
}

function getFiles(): UploadedFile[] {
  if (!globalStore.__pv_files) globalStore.__pv_files = []
  return globalStore.__pv_files
}

function getSettingsStore(): Settings {
  if (!globalStore.__pv_settings) globalStore.__pv_settings = { ...DEFAULT_SETTINGS }
  return globalStore.__pv_settings
}

// ---- Auth ----
export function verifyPassword(password: string): boolean {
  return hashPassword(password) === getSettingsStore().admin_password_hash
}

export function changeAdminPassword(newPassword: string) {
  getSettingsStore().admin_password_hash = hashPassword(newPassword)
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
  const s = getSettingsStore()
  return {
    uploads_enabled: s.uploads_enabled,
    max_file_size_mb: s.max_file_size_mb,
    allowed_formats: s.allowed_formats,
  }
}

export function getFullSettings(): Settings {
  return { ...getSettingsStore() }
}

export function updateSettings(
  updates: Partial<Pick<Settings, "uploads_enabled" | "max_file_size_mb" | "allowed_formats">>
) {
  const s = getSettingsStore()
  if (updates.uploads_enabled !== undefined) s.uploads_enabled = updates.uploads_enabled
  if (updates.max_file_size_mb !== undefined) s.max_file_size_mb = updates.max_file_size_mb
  if (updates.allowed_formats !== undefined) s.allowed_formats = updates.allowed_formats
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
  getPastes().unshift(paste)
  return paste
}

export function getPaste(id: string): Paste | null {
  const paste = getPastes().find((p) => p.id === id)
  if (!paste) return null
  if (paste.expires_at && new Date(paste.expires_at) < new Date()) return null
  return paste
}

export function getAllPastes(): Paste[] {
  return [...getPastes()]
}

export function deletePaste(id: string) {
  const arr = getPastes()
  const idx = arr.findIndex((p) => p.id === id)
  if (idx !== -1) arr.splice(idx, 1)
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
  getFiles().unshift(file)
  return file
}

export function getFile(id: string): UploadedFile | null {
  return getFiles().find((f) => f.id === id) || null
}

export function getAllFiles(): UploadedFile[] {
  return getFiles().map(({ data: _, ...rest }) => ({ ...rest, data: "" }))
}

export function deleteFileRecord(id: string) {
  const arr = getFiles()
  const idx = arr.findIndex((f) => f.id === id)
  if (idx !== -1) arr.splice(idx, 1)
}
