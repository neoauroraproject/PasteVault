import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PasswordGate } from "@/components/password-gate"

export default async function PublicConfigPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: config } = await supabase
    .from("configs")
    .select("*")
    .eq("id", id)
    .eq("enabled", true)
    .single()

  if (!config) {
    notFound()
  }

  // Check expiration
  if (config.expires_at && new Date(config.expires_at) < new Date()) {
    notFound()
  }

  // If password protected, show password gate
  if (config.password) {
    return <PasswordGate configId={config.id} />
  }

  // Return raw content
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <pre className="whitespace-pre-wrap break-all rounded-lg border border-border bg-card p-6 text-sm text-foreground font-mono leading-relaxed">
          {config.content}
        </pre>
      </div>
    </main>
  )
}
