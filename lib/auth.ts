"use server"

import { cookies } from "next/headers"
import { validateSession } from "./db"

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("cv_session")?.value
  if (!sessionId) return false
  return validateSession(sessionId)
}
