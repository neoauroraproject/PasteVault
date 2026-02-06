import { getAdminSettings } from "../actions"
import { AdminSettingsForm } from "@/components/admin-settings-form"
import { Settings } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
      </div>
      <AdminSettingsForm settings={settings} />
    </div>
  )
}
