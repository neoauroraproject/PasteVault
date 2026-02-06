import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { FileDownloadView } from "@/components/file-download-view"

export default async function PublicFilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: file } = await supabase
    .from("files")
    .select("*")
    .eq("id", id)
    .eq("enabled", true)
    .single()

  if (!file) {
    notFound()
  }

  // Check expiration
  if (file.expires_at && new Date(file.expires_at) < new Date()) {
    notFound()
  }

  // Get public URL for the file
  const { data: urlData } = supabase.storage
    .from("uploads")
    .getPublicUrl(file.file_path)

  return (
    <FileDownloadView
      fileName={file.name}
      originalName={file.original_name}
      fileSize={file.file_size}
      mimeType={file.mime_type}
      publicUrl={urlData.publicUrl}
    />
  )
}
