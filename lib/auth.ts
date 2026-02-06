"use server"

import { cookies } from "next/headers"
import { verifyPassword, createSession, validateSession, deleteSession } from "./db"

const SESSION_COOKIE = "cv_session"

export async function login(password: string): Promise<{ success: boolean; error?: string }> {
  if (!verifyPassword(password)) {
    return { success: false, error: "Invalid password" }
  }
  const sessionId = createSession()
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  })
  return { success: true }
}

export async function logout() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (sessionId) deleteSession(sessionId)
  cookieStore.delete(SESSION_COOKIE)
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return false
  return validateSession(sessionId)
}
