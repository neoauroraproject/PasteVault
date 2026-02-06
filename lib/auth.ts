"use server"

import { cookies } from "next/headers"
import { validateSessionToken } from "./db"

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("cv_session")?.value
  if (!token) return false
  return validateSessionToken(token)
}
