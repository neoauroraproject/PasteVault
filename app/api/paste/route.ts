import { createPaste } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { content, language, password, expires_in } = await request.json()

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    let expiresAt: string | null = null
    if (expires_in && expires_in !== "never") {
      const now = Date.now()
      const durations: Record<string, number> = {
        "10m": 10 * 60 * 1000,
        "1h": 60 * 60 * 1000,
        "1d": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      }
      if (durations[expires_in]) {
        expiresAt = new Date(now + durations[expires_in]).toISOString()
      }
    }

    const paste = createPaste(
      content.trim(),
      language || "plaintext",
      password?.trim() || null,
      expiresAt
    )

    return NextResponse.json({ success: true, id: paste.id })
  } catch {
    return NextResponse.json({ error: "Failed to create paste" }, { status: 500 })
  }
}
