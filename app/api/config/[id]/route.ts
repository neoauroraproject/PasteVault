import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

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

    const supabase = await createClient()
    const { data: config } = await supabase
      .from("configs")
      .select("content, password, enabled, expires_at")
      .eq("id", id)
      .eq("enabled", true)
      .single()

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
