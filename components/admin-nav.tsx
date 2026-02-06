"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Shield, FileText, Upload, Settings, LogOut, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/admin", label: "Pastes", icon: FileText },
  { href: "/admin/files", label: "Files", icon: Upload },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 shadow-sm md:px-8">
      <div className="flex items-center gap-6">
        <Link
          href="/admin"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground hidden sm:inline">
            PasteVault Admin
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 text-muted-foreground transition-all duration-200 hover:text-foreground",
                    isActive && "bg-muted text-foreground shadow-sm"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex items-center gap-1">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground transition-all duration-200 hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden md:inline">View Site</span>
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-muted-foreground transition-all duration-200 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Logout</span>
        </Button>
      </div>
    </header>
  )
}
