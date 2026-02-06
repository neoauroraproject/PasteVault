import { getDb } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

interface ConfigRow {
  content: string
  password: string | null
  enabled: number
  expires_at: string | null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { password } = await request.json()

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    const db = getDb()
    const config = db
      .prepare("SELECT content, password, enabled, expires_at FROM configs WHERE id = ? AND enabled = 1")
      .get(id) as ConfigRow | undefined

    if (!config) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (config.expires_at && new Date(config.expires_at) < new Date()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (config.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 403 })
    }

    return NextResponse.json({ content: config.content })
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }
}
