import { getDb } from "@/lib/db"
import { getSession } from "@/lib/auth"
import { ConfigList } from "@/components/config-list"
import { ConfigForm } from "@/components/config-form"
import { FileText } from "lucide-react"

export const dynamic = "force-dynamic"

interface ConfigRow {
  id: string
  name: string
  content: string
  password: string | null
  expires_at: string | null
  enabled: number
  created_at: string
  updated_at: string
}

export default async function AdminConfigsPage() {
  await getSession()
  const db = getDb()
  const rows = db
    .prepare("SELECT * FROM configs ORDER BY created_at DESC")
    .all() as ConfigRow[]

  const configs = rows.map((r) => ({
    ...r,
    enabled: r.enabled === 1,
  }))

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Configs</h1>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {configs.length}
          </span>
        </div>
        <ConfigForm />
      </div>
      <ConfigList configs={configs} />
    </div>
  )
}
