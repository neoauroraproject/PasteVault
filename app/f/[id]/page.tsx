import { getDb } from "@/lib/db"
import { notFound } from "next/navigation"
import { FileDownloadView } from "@/components/file-download-view"

export const dynamic = "force-dynamic"

interface FileRow {
  id: string
  name: string
  original_name: string
  file_path: string
  file_size: number
  mime_type: string | null
  expires_at: string | null
  enabled: number
}

export default async function PublicFilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!/^[a-f0-9-]{36}$/i.test(id)) {
    notFound()
  }

  const db = getDb()
  const file = db
    .prepare("SELECT * FROM files WHERE id = ? AND enabled = 1")
    .get(id) as FileRow | undefined

  if (!file) {
    notFound()
  }

  // Check expiration
  if (file.expires_at && new Date(file.expires_at) < new Date()) {
    notFound()
  }

  return (
    <FileDownloadView
      fileName={file.name}
      originalName={file.original_name}
      fileSize={file.file_size}
      mimeType={file.mime_type}
      downloadUrl={`/api/files/serve/${file.id}`}
    />
  )
}
