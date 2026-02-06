import React from "react"
import { redirect } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import { AdminNav } from "@/components/admin-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let authed = false
  try {
    authed = await isAuthenticated()
  } catch {
    authed = false
  }
  if (!authed) redirect("/auth/login")

  return (
    <div className="flex min-h-screen flex-col">
      <AdminNav githubUrl="https://github.com" />
      <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      <footer className="border-t border-border px-4 py-4 md:px-8">
        <p className="text-center text-xs text-muted-foreground">
          Design and developed by{" "}
          <a
            href="https://t.me/hmrayserver"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
          >
            Hmray
          </a>
        </p>
      </footer>
    </div>
  )
}
