import { getSettings } from "@/lib/db"
import { NextResponse } from "next/server"

// Public endpoint to get upload settings (no sensitive data)
export const dynamic = "force-dynamic"

export async function GET() {
  const settings = getSettings()
  console.log("[v0] GET /api/settings returning:", JSON.stringify(settings))
  return NextResponse.json({
    uploads_enabled: settings.uploads_enabled,
    max_file_size_mb: settings.max_file_size_mb,
    allowed_formats: settings.allowed_formats,
  })
}
