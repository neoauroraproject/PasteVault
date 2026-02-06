import { getFile } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const file = getFile(id)

  if (!file || !file.data) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const buffer = Buffer.from(file.data, "base64")

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": file.mime_type || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.original_name)}"`,
      "Content-Length": String(buffer.length),
    },
  })
}
