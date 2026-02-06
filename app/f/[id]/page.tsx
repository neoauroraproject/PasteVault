import { getFile } from "@/lib/db"
import { notFound } from "next/navigation"
import { FileViewer } from "@/components/file-viewer"

export const dynamic = "force-dynamic"

export default async function FilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const file = getFile(id)

  if (!file) notFound()

  return (
    <FileViewer
      id={file.id}
      originalName={file.original_name}
      mimeType={file.mime_type}
      fileSize={file.file_size}
    />
  )
}
