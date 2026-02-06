import { createClient } from "@/lib/supabase/server"
import { ConfigList } from "@/components/config-list"
import { ConfigForm } from "@/components/config-form"
import { FileText } from "lucide-react"

export default async function AdminConfigsPage() {
  const supabase = await createClient()
  const { data: configs } = await supabase
    .from("configs")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">Configs</h1>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {configs?.length ?? 0}
          </span>
        </div>
        <ConfigForm />
      </div>
      <ConfigList configs={configs ?? []} />
    </div>
  )
}
