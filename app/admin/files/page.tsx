import { getAdminFiles } from "../actions"
import { AdminFileList } from "@/components/admin-file-list"
import { Upload } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminFilesPage() {
  const files = await getAdminFiles()

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <Upload className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">All Files</h1>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {files.length}
        </span>
      </div>
      <AdminFileList files={files} />
    </div>
  )
}
