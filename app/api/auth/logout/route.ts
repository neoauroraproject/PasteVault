import { deleteSession } from "@/lib/db"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("cv_session")?.value
  if (sessionId) deleteSession(sessionId)
  const response = NextResponse.json({ success: true })
  response.cookies.delete("cv_session")
  return response
}
