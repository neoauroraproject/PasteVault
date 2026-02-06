import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Shield className="mb-4 h-10 w-10 text-muted-foreground" />
      <h1 className="mb-2 text-2xl font-semibold text-foreground">404</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        This page does not exist or has expired.
      </p>
      <Link href="/">
        <Button variant="outline" className="border-border text-foreground hover:bg-accent bg-transparent">
          Go Home
        </Button>
      </Link>
    </main>
  )
}
