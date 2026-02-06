import { getSettings } from "@/lib/db"
import { NextResponse } from "next/server"

// Public endpoint to get upload settings (no sensitive data)
export async function GET() {
  const settings = getSettings()
  return NextResponse.json({
    uploads_enabled: settings.uploads_enabled,
    max_file_size_mb: settings.max_file_size_mb,
    allowed_formats: settings.allowed_formats,
  })
}
