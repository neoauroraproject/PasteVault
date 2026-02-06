import { getDb } from "@/lib/db"
import { notFound } from "next/navigation"
import { PasswordGate } from "@/components/password-gate"

export const dynamic = "force-dynamic"

interface ConfigRow {
  id: string
  name: string
  content: string
  password: string | null
  expires_at: string | null
  enabled: number
}

export default async function PublicConfigPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Validate UUID-ish format to prevent injection
  if (!/^[a-f0-9-]{36}$/i.test(id)) {
    notFound()
  }

  const db = getDb()
  const config = db
    .prepare("SELECT * FROM configs WHERE id = ? AND enabled = 1")
    .get(id) as ConfigRow | undefined

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
