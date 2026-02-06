import { createClient } from "@/lib/supabase/server"
import { FileList } from "@/components/file-list"
import { FileUploadForm } from "@/components/file-upload-form"
import { Upload } from "lucide-react"

export default async function AdminFilesPage() {
  const supabase = await createClient()
  const { data: files } = await supabase
    .from("files")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Upload className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Files</h1>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {files?.length ?? 0}
          </span>
        </div>
        <FileUploadForm />
      </div>
      <FileList files={files ?? []} />
    </div>
  )
}
