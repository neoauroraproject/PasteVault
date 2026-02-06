import React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { AdminNav } from "@/components/admin-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSession()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminNav username={user.username} />
      <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  )
}
