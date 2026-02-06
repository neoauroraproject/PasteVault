import React from "react"
import { redirect } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import { AdminNav } from "@/components/admin-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authed = await isAuthenticated()
  if (!authed) redirect("/auth/login")

  return (
    <div className="flex min-h-screen flex-col">
      <AdminNav githubUrl="https://github.com" />
      <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      <footer className="border-t border-border px-4 py-4 md:px-8">
        <p className="text-center text-xs text-muted-foreground">
          PasteVault &copy; {new Date().getFullYear()} &mdash; All rights reserved.
        </p>
      </footer>
    </div>
  )
}
