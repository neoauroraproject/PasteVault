import { getDb } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { FileList } from "@/components/file-list"
import { FileUploadForm } from "@/components/file-upload-form"
import { Upload } from "lucide-react"

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
  created_at: string
  updated_at: string
}

export default async function AdminFilesPage() {
  await getSession()
  const db = getDb()
  const rows = db
    .prepare("SELECT * FROM files ORDER BY created_at DESC")
    .all() as FileRow[]

  const files = rows.map((r) => ({
    ...r,
    enabled: r.enabled === 1,
  }))

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Files</h1>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {files.length}
          </span>
        </div>
        <FileUploadForm />
      </div>
      <FileList files={files} />
    </div>
  )
}
