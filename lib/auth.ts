import { getDb } from "./db"
import bcrypt from "bcryptjs"
import { v4 as uuid } from "uuid"
import { cookies } from "next/headers"

const SESSION_COOKIE = "cv_session"
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface AdminUser {
  id: number
  username: string
}

// Ensure a default admin exists (admin / admin)
export function ensureAdmin() {
  const db = getDb()
  const existing = db.prepare("SELECT id FROM admin WHERE id = 1").get()
  if (!existing) {
    const hash = bcrypt.hashSync("admin", 10)
    db.prepare("INSERT OR IGNORE INTO admin (id, username, password_hash) VALUES (1, ?, ?)").run(
      "admin",
      hash
    )
  }
}

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const db = getDb()
  ensureAdmin()

  const admin = db
    .prepare("SELECT id, username, password_hash FROM admin WHERE username = ?")
    .get(username) as { id: number; username: string; password_hash: string } | undefined

  if (!admin) {
    return { success: false, error: "Invalid credentials" }
  }

  const valid = bcrypt.compareSync(password, admin.password_hash)
  if (!valid) {
    return { success: false, error: "Invalid credentials" }
  }

  // Create session
  const sessionId = uuid()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()
  db.prepare("INSERT INTO sessions (id, admin_id, expires_at) VALUES (?, ?, ?)").run(
    sessionId,
    admin.id,
    expiresAt
  )

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  })

  return { success: true }
}

export async function logout() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (sessionId) {
    const db = getDb()
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId)
  }
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return null

  const db = getDb()
  ensureAdmin()

  const session = db
    .prepare(
      `SELECT s.admin_id, s.expires_at, a.username 
       FROM sessions s 
       JOIN admin a ON a.id = s.admin_id 
       WHERE s.id = ?`
    )
    .get(sessionId) as { admin_id: number; expires_at: string; username: string } | undefined

  if (!session) return null

  // Check expiration
  if (new Date(session.expires_at) < new Date()) {
    db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId)
    return null
  }

  return { id: session.admin_id, username: session.username }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getSession()
  if (!user) return { success: false, error: "Not authenticated" }

  const db = getDb()
  const admin = db
    .prepare("SELECT password_hash FROM admin WHERE id = ?")
    .get(user.id) as { password_hash: string } | undefined

  if (!admin) return { success: false, error: "Admin not found" }

  const valid = bcrypt.compareSync(currentPassword, admin.password_hash)
  if (!valid) return { success: false, error: "Current password is incorrect" }

  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare("UPDATE admin SET password_hash = ? WHERE id = ?").run(hash, user.id)

  return { success: true }
}
