import { getPaste } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const paste = getPaste(id)

  if (!paste) {
    return NextResponse.json({ error: "Paste not found or expired" }, { status: 404 })
  }

  // If password-protected, require password
  if (paste.password) {
    try {
      const body = await request.json()
      if (body.password !== paste.password) {
        return NextResponse.json({ error: "Wrong password" }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: "Password required" }, { status: 403 })
    }
  }

  return NextResponse.json({
    id: paste.id,
    content: paste.content,
    language: paste.language,
    has_password: !!paste.password,
    created_at: paste.created_at,
  })
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const paste = getPaste(id)

  if (!paste) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({
    id: paste.id,
    has_password: !!paste.password,
    language: paste.language,
    created_at: paste.created_at,
    // Only send content if not password protected
    ...(paste.password ? {} : { content: paste.content }),
  })
}
