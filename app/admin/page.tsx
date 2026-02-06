import { getAdminPastes } from "./actions"
import { AdminPasteList } from "@/components/admin-paste-list"
import { FileText } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminPastesPage() {
  const pastes = await getAdminPastes()

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <FileText className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">All Pastes</h1>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {pastes.length}
        </span>
      </div>
      <AdminPasteList pastes={pastes} />
    </div>
  )
}
